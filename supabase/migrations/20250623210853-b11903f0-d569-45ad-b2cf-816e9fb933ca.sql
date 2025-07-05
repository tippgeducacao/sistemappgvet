
-- Analisar e corrigir o problema de foreign key constraints
-- Primeiro, vamos remover a constraint problemática e recriar com CASCADE

-- 1. Remover a constraint existente que está causando o problema
ALTER TABLE public.form_entries 
DROP CONSTRAINT IF EXISTS form_entries_aluno_id_fkey;

-- 2. Adicionar a constraint novamente com CASCADE para permitir exclusão automática
ALTER TABLE public.form_entries 
ADD CONSTRAINT form_entries_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id) 
ON DELETE SET NULL;

-- 3. Também garantir que a constraint de alunos para form_entries tenha CASCADE
ALTER TABLE public.alunos 
DROP CONSTRAINT IF EXISTS alunos_form_entry_id_fkey;

ALTER TABLE public.alunos 
ADD CONSTRAINT alunos_form_entry_id_fkey 
FOREIGN KEY (form_entry_id) REFERENCES public.form_entries(id) 
ON DELETE CASCADE;

-- 4. Recriar a função de exclusão com uma abordagem mais robusta
CREATE OR REPLACE FUNCTION public.delete_venda_cascade(venda_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  aluno_record RECORD;
BEGIN
  -- Log início da operação
  RAISE LOG 'Iniciando exclusão em cascata para venda ID: %', venda_id;
  
  -- Verificar se a venda existe
  IF NOT EXISTS (SELECT 1 FROM public.form_entries WHERE id = venda_id) THEN
    RAISE LOG 'Venda não encontrada: %', venda_id;
    RETURN true;
  END IF;
  
  -- ESTRATÉGIA: Usar transação e exclusão em ordem específica
  BEGIN
    -- 1. Buscar informações do aluno antes de excluir
    SELECT * INTO aluno_record FROM public.alunos WHERE form_entry_id = venda_id;
    
    -- 2. Excluir histórico de validações (sem dependências)
    DELETE FROM public.historico_validacoes WHERE form_entry_id = venda_id;
    RAISE LOG 'Histórico excluído para venda: %', venda_id;
    
    -- 3. Excluir respostas do formulário (sem dependências)
    DELETE FROM public.respostas_formulario WHERE form_entry_id = venda_id;
    RAISE LOG 'Respostas excluídas para venda: %', venda_id;
    
    -- 4. CRÍTICO: Quebrar a dependência circular
    -- Primeiro, definir aluno_id como NULL na form_entries
    UPDATE public.form_entries SET aluno_id = NULL WHERE id = venda_id;
    RAISE LOG 'Referência aluno_id removida da venda: %', venda_id;
    
    -- 5. Agora excluir o aluno (se existir)
    IF aluno_record.id IS NOT NULL THEN
      DELETE FROM public.alunos WHERE id = aluno_record.id;
      RAISE LOG 'Aluno excluído: %', aluno_record.id;
    END IF;
    
    -- 6. Finalmente, excluir a form_entry
    DELETE FROM public.form_entries WHERE id = venda_id;
    RAISE LOG 'Form entry excluída: %', venda_id;
    
    -- Verificação final
    IF EXISTS (SELECT 1 FROM public.form_entries WHERE id = venda_id) THEN
      RAISE LOG 'ERRO: Venda ainda existe após exclusão: %', venda_id;
      RETURN false;
    END IF;
    
    RAISE LOG 'Exclusão concluída com SUCESSO para venda: %', venda_id;
    RETURN true;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'ERRO na exclusão: % - %', SQLSTATE, SQLERRM;
    RETURN false;
  END;
END;
$$;

-- 5. Garantir permissões
GRANT EXECUTE ON FUNCTION public.delete_venda_cascade TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_venda_cascade TO anon;
