
-- Primeiro, vamos verificar e corrigir as políticas RLS para form_entries
-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Secretaria can update form entries" ON public.form_entries;
DROP POLICY IF EXISTS "Secretaria can view all entries" ON public.form_entries;

-- Criar política específica para secretaria visualizar todas as vendas
CREATE POLICY "Secretaria can view all form entries" 
ON public.form_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'secretaria'
  )
);

-- Criar política específica para secretaria atualizar vendas
CREATE POLICY "Secretaria can update form entries" 
ON public.form_entries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'secretaria'
  )
);

-- Melhorar a função update_venda_status para ser mais robusta
CREATE OR REPLACE FUNCTION public.update_venda_status(
  venda_id uuid,
  new_status text,
  pontuacao_validada_param double precision DEFAULT NULL,
  motivo_pendencia_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected integer;
BEGIN
  -- Log para debug
  RAISE LOG 'Tentando atualizar venda: % para status: %', venda_id, new_status;
  
  -- Atualizar o status da venda
  UPDATE public.form_entries 
  SET 
    status = new_status::form_status,
    pontuacao_validada = CASE 
      WHEN pontuacao_validada_param IS NOT NULL THEN pontuacao_validada_param 
      ELSE pontuacao_validada 
    END,
    motivo_pendencia = CASE 
      WHEN motivo_pendencia_param IS NOT NULL THEN motivo_pendencia_param 
      ELSE motivo_pendencia 
    END,
    atualizado_em = now()
  WHERE id = venda_id;
  
  -- Verificar quantas linhas foram afetadas
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RAISE LOG 'Linhas afetadas: %', rows_affected;
  
  -- Retornar true se pelo menos uma linha foi atualizada
  RETURN rows_affected > 0;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Erro na função update_venda_status: %', SQLERRM;
  RETURN false;
END;
$$;

-- Garantir que a função tenha as permissões corretas
GRANT EXECUTE ON FUNCTION public.update_venda_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_venda_status TO anon;

-- Verificar se o enum form_status tem os valores corretos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_status') THEN
    CREATE TYPE form_status AS ENUM ('pendente', 'matriculado', 'desistiu');
  END IF;
END$$;
