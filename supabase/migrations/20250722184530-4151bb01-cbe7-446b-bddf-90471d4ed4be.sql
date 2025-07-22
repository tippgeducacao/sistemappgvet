-- Adicionar campo obrigatório para link da reunião
ALTER TABLE public.agendamentos 
ADD COLUMN link_reuniao TEXT NOT NULL DEFAULT '';

-- Atualizar registros existentes com valor padrão
UPDATE public.agendamentos 
SET link_reuniao = '' 
WHERE link_reuniao IS NULL;

-- Comentário sobre o campo
COMMENT ON COLUMN public.agendamentos.link_reuniao IS 'Link da reunião online (obrigatório) - Zoom, Google Meet, Teams, etc.';