-- Corrigir função de verificação de conflitos com eventos especiais
-- O problema é que o agendamento vem com timezone, mas precisamos comparar no horário local
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
  -- Converter para timezone brasileiro (UTC-3)
  agendamento_local_inicio TIMESTAMP;
  agendamento_local_fim TIMESTAMP;
BEGIN
  -- Converter timestamps para timezone brasileiro (UTC-3)
  agendamento_local_inicio := data_inicio_agendamento AT TIME ZONE 'America/Sao_Paulo';
  agendamento_local_fim := data_fim_agendamento AT TIME ZONE 'America/Sao_Paulo';
  
  -- Extrair data e horários do agendamento no timezone local
  data_agendamento_date := agendamento_local_inicio::DATE;
  dia_semana := EXTRACT(DOW FROM agendamento_local_inicio);
  hora_inicio_agendamento := agendamento_local_inicio::TIME;
  hora_fim_agendamento := agendamento_local_fim::TIME;
  
  -- Log de debug
  RAISE NOTICE 'Verificando conflito - Data: %, Dia semana: %, Horario: % - %', 
    data_agendamento_date, dia_semana, hora_inicio_agendamento, hora_fim_agendamento;
  
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
    RAISE NOTICE 'Evento encontrado: % (% - %)', evento_record.titulo, evento_record.hora_inicio, evento_record.hora_fim;
    
    -- Verificar sobreposição de horários
    -- Há conflito se o início do agendamento é antes do fim do evento 
    -- E o fim do agendamento é depois do início do evento
    IF (hora_inicio_agendamento < evento_record.hora_fim AND 
        hora_fim_agendamento > evento_record.hora_inicio) THEN
      RAISE NOTICE 'CONFLITO DETECTADO!';
      RETURN TRUE; -- Conflito detectado
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Sem conflitos detectados';
  RETURN FALSE; -- Sem conflitos
END;
$function$;