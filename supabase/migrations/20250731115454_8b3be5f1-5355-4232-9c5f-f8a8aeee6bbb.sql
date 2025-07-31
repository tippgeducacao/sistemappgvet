-- Criar função para verificar e atualizar agendamentos atrasados automaticamente
CREATE OR REPLACE FUNCTION public.check_and_update_overdue_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar agendamentos que passaram do horário para status 'atrasado'
  -- quando o vendedor não lançou o resultado
  UPDATE agendamentos 
  SET status = 'atrasado'
  WHERE status = 'agendado' 
  AND resultado_reuniao IS NULL  -- Vendedor não lançou resultado
  AND (
    (data_fim_agendamento IS NOT NULL AND data_fim_agendamento < now()) 
    OR 
    (data_fim_agendamento IS NULL AND data_agendamento + INTERVAL '1 hour' < now())
  );
END;
$$;