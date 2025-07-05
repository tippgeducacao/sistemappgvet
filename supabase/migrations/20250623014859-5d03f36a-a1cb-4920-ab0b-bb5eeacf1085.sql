
-- Criar função que executa a atualização de status com privilégios de segurança
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
BEGIN
  -- Atualizar o status da venda
  UPDATE public.form_entries 
  SET 
    status = new_status::form_status,
    pontuacao_validada = COALESCE(pontuacao_validada_param, pontuacao_validada),
    motivo_pendencia = COALESCE(motivo_pendencia_param, motivo_pendencia),
    atualizado_em = now()
  WHERE id = venda_id;
  
  -- Verificar se a atualização foi bem-sucedida
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Conceder permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.update_venda_status TO authenticated;
