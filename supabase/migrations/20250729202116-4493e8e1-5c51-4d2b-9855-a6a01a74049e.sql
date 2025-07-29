-- Correção de status inconsistentes na tabela agendamentos
-- Padronizar todos os status para valores válidos

-- Atualizar qualquer status que não seja um dos valores válidos para 'agendado'
UPDATE agendamentos 
SET status = 'agendado' 
WHERE status NOT IN ('agendado', 'cancelado', 'atrasado', 'realizado', 'reagendado');

-- Adicionar constraint para garantir que apenas status válidos sejam aceitos
ALTER TABLE agendamentos 
ADD CONSTRAINT check_agendamentos_status 
CHECK (status IN ('agendado', 'cancelado', 'atrasado', 'realizado', 'reagendado'));