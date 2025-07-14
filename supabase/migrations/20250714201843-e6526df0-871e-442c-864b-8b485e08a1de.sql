-- Adicionar campos de pós-graduações e horário de trabalho aos perfis dos vendedores
ALTER TABLE public.profiles 
ADD COLUMN pos_graduacoes UUID[] DEFAULT '{}',
ADD COLUMN horario_trabalho JSONB DEFAULT '{"manha_inicio": "09:00", "manha_fim": "12:00", "tarde_inicio": "13:00", "tarde_fim": "18:00"}';

-- Atualizar vendedores existentes com horário padrão
UPDATE public.profiles 
SET horario_trabalho = '{"manha_inicio": "09:00", "manha_fim": "12:00", "tarde_inicio": "13:00", "tarde_fim": "18:00"}'
WHERE user_type IN ('vendedor', 'sdr_inbound', 'sdr_outbound');