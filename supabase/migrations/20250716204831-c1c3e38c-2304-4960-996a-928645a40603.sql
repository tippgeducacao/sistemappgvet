-- Remover a tabela pos_graduacoes que não será mais necessária
DROP TABLE IF EXISTS public.pos_graduacoes;

-- Atualizar a tabela agendamentos para usar string diretamente (nome da pós-graduação)
-- A tabela já está correta, só precisamos ajustar a lógica da aplicação