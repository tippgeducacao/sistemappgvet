-- Adicionar campos de recorrência na tabela eventos_especiais
ALTER TABLE public.eventos_especiais 
ADD COLUMN is_recorrente BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN tipo_recorrencia TEXT, -- 'semanal', 'mensal', 'anual'
ADD COLUMN dias_semana INTEGER[], -- [0,1,2,3,4,5,6] onde 0=domingo, 1=segunda, etc
ADD COLUMN hora_inicio TIME NOT NULL DEFAULT '09:00',
ADD COLUMN hora_fim TIME NOT NULL DEFAULT '10:00',
ADD COLUMN data_inicio_recorrencia DATE,
ADD COLUMN data_fim_recorrencia DATE;

-- Atualizar dados existentes para ter horários padrão
UPDATE public.eventos_especiais 
SET 
  hora_inicio = EXTRACT(TIME FROM data_inicio),
  hora_fim = EXTRACT(TIME FROM data_fim),
  data_inicio_recorrencia = CASE 
    WHEN is_recorrente THEN EXTRACT(DATE FROM data_inicio)
    ELSE NULL
  END,
  data_fim_recorrencia = CASE 
    WHEN is_recorrente THEN EXTRACT(DATE FROM data_fim)
    ELSE NULL
  END;

-- Função melhorada para verificar conflitos com eventos especiais incluindo recorrência
CREATE OR REPLACE FUNCTION public.verificar_conflito_evento_especial(
  data_inicio_agendamento TIMESTAMP WITH TIME ZONE,
  data_fim_agendamento TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  evento RECORD;
  data_agendamento DATE;
  hora_inicio_agendamento TIME;
  hora_fim_agendamento TIME;
  dia_semana_agendamento INTEGER;
BEGIN
  -- Extrair data e horários do agendamento
  data_agendamento := data_inicio_agendamento::DATE;
  hora_inicio_agendamento := data_inicio_agendamento::TIME;
  hora_fim_agendamento := data_fim_agendamento::TIME;
  dia_semana_agendamento := EXTRACT(DOW FROM data_agendamento);
  
  -- Verificar todos os eventos especiais
  FOR evento IN 
    SELECT * FROM public.eventos_especiais
  LOOP
    -- Se é evento único (não recorrente)
    IF NOT evento.is_recorrente THEN
      -- Verificar conflito direto com evento único
      IF (
        (data_inicio_agendamento >= evento.data_inicio AND data_inicio_agendamento < evento.data_fim) OR
        (data_fim_agendamento > evento.data_inicio AND data_fim_agendamento <= evento.data_fim) OR
        (data_inicio_agendamento <= evento.data_inicio AND data_fim_agendamento >= evento.data_fim)
      ) THEN
        RETURN TRUE;
      END IF;
    
    -- Se é evento recorrente
    ELSE
      -- Verificar se a data do agendamento está dentro do período de recorrência
      IF data_agendamento >= evento.data_inicio_recorrencia AND 
         data_agendamento <= evento.data_fim_recorrencia THEN
        
        -- Verificar recorrência semanal
        IF evento.tipo_recorrencia = 'semanal' THEN
          -- Verificar se o dia da semana está na lista de dias do evento
          IF dia_semana_agendamento = ANY(evento.dias_semana) THEN
            -- Verificar conflito de horário
            IF (
              (hora_inicio_agendamento >= evento.hora_inicio AND hora_inicio_agendamento < evento.hora_fim) OR
              (hora_fim_agendamento > evento.hora_inicio AND hora_fim_agendamento <= evento.hora_fim) OR
              (hora_inicio_agendamento <= evento.hora_inicio AND hora_fim_agendamento >= evento.hora_fim)
            ) THEN
              RETURN TRUE;
            END IF;
          END IF;
        END IF;
        
        -- Aqui podem ser adicionados outros tipos de recorrência no futuro
        -- como 'mensal' ou 'anual'
        
      END IF;
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$;