-- Aprimorar função de verificação de conflitos com eventos especiais
CREATE OR REPLACE FUNCTION public.verificar_conflito_evento_especial(
  data_inicio_agendamento timestamp with time zone, 
  data_fim_agendamento timestamp with time zone
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  evento_record RECORD;
  data_agendamento_date DATE;
  dia_semana INTEGER;
  hora_inicio_agendamento TIME;
  hora_fim_agendamento TIME;
BEGIN
  -- Extrair data e horários do agendamento
  data_agendamento_date := data_inicio_agendamento::DATE;
  dia_semana := EXTRACT(DOW FROM data_inicio_agendamento);
  hora_inicio_agendamento := data_inicio_agendamento::TIME;
  hora_fim_agendamento := data_fim_agendamento::TIME;
  
  -- Verificar eventos especiais
  FOR evento_record IN 
    SELECT * FROM public.eventos_especiais
    WHERE (
      -- Evento único
      (NOT is_recorrente AND 
       data_agendamento_date >= data_inicio::DATE AND 
       data_agendamento_date <= data_fim::DATE)
      OR
      -- Evento recorrente
      (is_recorrente AND 
       dia_semana = ANY(dias_semana) AND
       (data_inicio_recorrencia IS NULL OR data_agendamento_date >= data_inicio_recorrencia) AND
       (data_fim_recorrencia IS NULL OR data_agendamento_date <= data_fim_recorrencia))
    )
  LOOP
    -- Verificar sobreposição de horários
    -- Há conflito se o início do agendamento é antes do fim do evento 
    -- E o fim do agendamento é depois do início do evento
    IF (hora_inicio_agendamento < evento_record.hora_fim AND 
        hora_fim_agendamento > evento_record.hora_inicio) THEN
      RETURN TRUE; -- Conflito detectado
    END IF;
  END LOOP;
  
  RETURN FALSE; -- Sem conflitos
END;
$function$;