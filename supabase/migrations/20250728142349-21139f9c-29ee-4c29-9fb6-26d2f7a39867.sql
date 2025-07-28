-- Limpar todos os dados de teste para produção (ordem correta)

-- Limpar histórico de validações
DELETE FROM public.historico_validacoes;

-- Limpar respostas de formulário
DELETE FROM public.respostas_formulario;

-- Limpar vendas (form_entries) primeiro
DELETE FROM public.form_entries;

-- Limpar alunos depois
DELETE FROM public.alunos;

-- Limpar agendamentos (reuniões)
DELETE FROM public.agendamentos;

-- Limpar interações com leads se houver
DELETE FROM public.lead_interactions;