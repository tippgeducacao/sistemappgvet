-- Adicionar status 'remarcado' à constraint de check da tabela agendamentos
ALTER TABLE public.agendamentos 
DROP CONSTRAINT IF EXISTS check_agendamentos_status;

ALTER TABLE public.agendamentos 
ADD CONSTRAINT check_agendamentos_status 
CHECK (status IN ('agendado', 'cancelado', 'realizado', 'atrasado', 'reagendado', 'remarcado', 'finalizado', 'finalizado_venda'));