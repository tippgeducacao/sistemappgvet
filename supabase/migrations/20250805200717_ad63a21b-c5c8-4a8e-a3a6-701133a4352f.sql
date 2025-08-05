-- Limpar todas as vendas e reuniões existentes

-- Deletar histórico de validações
DELETE FROM public.historico_validacoes;

-- Deletar respostas de formulário
DELETE FROM public.respostas_formulario;

-- Deletar alunos
DELETE FROM public.alunos;

-- Deletar vendas (form_entries)
DELETE FROM public.form_entries;

-- Deletar agendamentos/reuniões
DELETE FROM public.agendamentos;

-- Resetar sequências se houver
-- (Não há sequências auto-incrementais neste schema pois usamos UUID)