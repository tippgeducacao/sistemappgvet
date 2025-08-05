-- ATENÇÃO: Esta migração irá deletar TODOS os dados de reuniões e vendas
-- Certifique-se de que realmente deseja fazer isso

-- Deletar todas as interações de leads
DELETE FROM public.lead_interactions;

-- Deletar todos os agendamentos/reuniões
DELETE FROM public.agendamentos;

-- Deletar todas as respostas de formulário
DELETE FROM public.respostas_formulario;

-- Deletar todo o histórico de validações
DELETE FROM public.historico_validacoes;

-- Deletar todos os alunos
DELETE FROM public.alunos;

-- Deletar todas as vendas (form_entries)
DELETE FROM public.form_entries;

-- Deletar todos os leads
DELETE FROM public.leads;