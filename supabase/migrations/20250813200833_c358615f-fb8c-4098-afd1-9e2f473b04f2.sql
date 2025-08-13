-- Primeiro, adicionar os campos de recorrência na tabela eventos_especiais
ALTER TABLE public.eventos_especiais 
ADD COLUMN IF NOT EXISTS is_recorrente BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_recorrencia TEXT,
ADD COLUMN IF NOT EXISTS dias_semana INTEGER[],
ADD COLUMN IF NOT EXISTS hora_inicio TIME NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS hora_fim TIME NOT NULL DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS data_inicio_recorrencia DATE,
ADD COLUMN IF NOT EXISTS data_fim_recorrencia DATE;

-- Atualizar dados existentes para ter horários padrão
UPDATE public.eventos_especiais 
SET 
  hora_inicio = COALESCE(hora_inicio, EXTRACT(TIME FROM data_inicio)),
  hora_fim = COALESCE(hora_fim, EXTRACT(TIME FROM data_fim))
WHERE hora_inicio IS NULL OR hora_fim IS NULL;