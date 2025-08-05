-- Limpar todas as vendas e reuniões existentes
-- Deletando na ordem correta para respeitar as foreign keys

-- Deletar histórico de validações (referencia form_entries)
DELETE FROM public.historico_validacoes;

-- Deletar respostas de formulário (referencia form_entries)
DELETE FROM public.respostas_formulario;

-- Deletar vendas primeiro (form_entries referencia alunos)
DELETE FROM public.form_entries;

-- Agora pode deletar alunos
DELETE FROM public.alunos;

-- Deletar agendamentos/reuniões
DELETE FROM public.agendamentos;