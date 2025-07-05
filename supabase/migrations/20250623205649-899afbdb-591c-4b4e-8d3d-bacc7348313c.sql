


-- Criar função RPC para exclusão em cascata de vendas
CREATE OR REPLACE FUNCTION public.delete_venda_cascade(venda_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log início da operação
  RAISE LOG 'Iniciando exclusão em cascata para venda ID: %', venda_id;
  
  -- Verificar se a venda existe
  IF NOT EXISTS (SELECT 1 FROM public.form_entries WHERE id = venda_id) THEN
    RAISE LOG 'Venda não encontrada, considerando como já excluída: %', venda_id;
    RETURN true;
  END IF;
  
  -- Exclusão em cascata - ORDEM CRÍTICA para evitar violações de foreign key
  
  -- 1. Excluir histórico de validações (não tem dependências)
  DELETE FROM public.historico_validacoes WHERE form_entry_id = venda_id;
  RAISE LOG 'Histórico de validações excluído para venda: %', venda_id;
  
  -- 2. Excluir respostas do formulário (não tem dependências)
  DELETE FROM public.respostas_formulario WHERE form_entry_id = venda_id;
  RAISE LOG 'Respostas do formulário excluídas para venda: %', venda_id;
  
  -- 3. CRÍTICO: Primeiro remover a referência aluno_id da form_entries
  UPDATE public.form_entries SET aluno_id = NULL WHERE id = venda_id;
  RAISE LOG 'Referência aluno_id removida da venda: %', venda_id;
  
  -- 4. AGORA pode excluir o aluno sem violação de foreign key
  DELETE FROM public.alunos WHERE form_entry_id = venda_id;
  RAISE LOG 'Aluno excluído para venda: %', venda_id;
  
  -- 5. Finalmente, excluir a entrada principal
  DELETE FROM public.form_entries WHERE id = venda_id;
  RAISE LOG 'Entrada principal excluída para venda: %', venda_id;
  
  -- Verificação final rigorosa
  IF EXISTS (SELECT 1 FROM public.form_entries WHERE id = venda_id) THEN
    RAISE LOG 'ERRO CRÍTICO: Venda ainda existe após exclusão: %', venda_id;
    RETURN false;
  END IF;
  
  RAISE LOG 'Exclusão em cascata concluída com SUCESSO para venda: %', venda_id;
  RETURN true;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'ERRO FATAL na exclusão em cascata: % - %', SQLSTATE, SQLERRM;
  -- Em caso de erro, tentar rollback implícito
  RETURN false;
END;
$$;

-- Garantir permissões corretas
GRANT EXECUTE ON FUNCTION public.delete_venda_cascade TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_venda_cascade TO anon;


