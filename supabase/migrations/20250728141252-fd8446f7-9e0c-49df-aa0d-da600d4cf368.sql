-- Limpar todos os dados de teste para produção

-- Limpar histórico de validações
DELETE FROM public.historico_validacoes;

-- Limpar respostas de formulário
DELETE FROM public.respostas_formulario;

-- Limpar alunos
DELETE FROM public.alunos;

-- Limpar vendas (form_entries)
DELETE FROM public.form_entries;

-- Limpar agendamentos (reuniões)
DELETE FROM public.agendamentos;

-- Limpar interações com leads se houver
DELETE FROM public.lead_interactions;