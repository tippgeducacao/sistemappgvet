-- Adicionar coluna form_entry_id à tabela agendamentos para vincular reuniões às vendas
ALTER TABLE public.agendamentos 
ADD COLUMN form_entry_id uuid REFERENCES public.form_entries(id);

-- Criar índices para otimizar consultas
CREATE INDEX idx_agendamentos_form_entry_id ON public.agendamentos(form_entry_id);
CREATE INDEX idx_agendamentos_data_resultado ON public.agendamentos(data_resultado);
CREATE INDEX idx_form_entries_data_assinatura ON public.form_entries(data_assinatura_contrato);

-- Comentários para documentação
COMMENT ON COLUMN public.agendamentos.form_entry_id IS 'Vincula a reunião à venda gerada, usado para rastrear conversões';