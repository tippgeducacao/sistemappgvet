-- Adicionar campo data_assinatura_contrato na tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN IF NOT EXISTS data_assinatura_contrato date;