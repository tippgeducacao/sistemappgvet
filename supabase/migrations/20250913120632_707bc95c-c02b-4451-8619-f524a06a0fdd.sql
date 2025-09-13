-- Atualizar as permissões da função para funcionar com RLS
-- Criar função simplificada que pode ser executada pelos usuários
CREATE OR REPLACE FUNCTION public.vincular_agendamento_especifico(p_agendamento_id UUID, p_form_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Verificar permissões - apenas admins, diretores e secretarias
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Vincular o agendamento à venda
  UPDATE public.agendamentos 
  SET 
    form_entry_id = p_form_entry_id,
    updated_at = now()
  WHERE id = p_agendamento_id;
  
  -- Buscar e atualizar SDR se necessário
  UPDATE public.form_entries fe
  SET 
    sdr_id = (SELECT a.sdr_id FROM public.agendamentos a WHERE a.id = p_agendamento_id),
    atualizado_em = now()
  WHERE fe.id = p_form_entry_id 
  AND fe.sdr_id IS NULL;

  RETURN TRUE;
END;
$$;