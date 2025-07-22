-- Adicionar campo para horário final do agendamento
ALTER TABLE public.agendamentos 
ADD COLUMN data_fim_agendamento TIMESTAMP WITH TIME ZONE;