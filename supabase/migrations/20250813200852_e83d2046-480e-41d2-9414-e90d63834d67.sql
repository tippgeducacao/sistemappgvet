-- Adicionar os campos de recorrência na tabela eventos_especiais
ALTER TABLE public.eventos_especiais 
ADD COLUMN IF NOT EXISTS is_recorrente BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_recorrencia TEXT,
ADD COLUMN IF NOT EXISTS dias_semana INTEGER[],
ADD COLUMN IF NOT EXISTS hora_inicio TIME NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS hora_fim TIME NOT NULL DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS data_inicio_recorrencia DATE,
ADD COLUMN IF NOT EXISTS data_fim_recorrencia DATE;

-- Atualizar dados existentes para ter horários padrão extraídos das datas
UPDATE public.eventos_especiais 
SET 
  hora_inicio = COALESCE(hora_inicio, data_inicio::TIME),
  hora_fim = COALESCE(hora_fim, data_fim::TIME)
WHERE hora_inicio = '09:00' OR hora_fim = '10:00';