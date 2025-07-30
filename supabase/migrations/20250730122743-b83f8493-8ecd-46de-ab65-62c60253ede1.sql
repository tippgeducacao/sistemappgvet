-- Adicionar campo data_aprovacao na tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN data_aprovacao TIMESTAMP WITH TIME ZONE;

-- Comentário explicativo
COMMENT ON COLUMN public.form_entries.data_aprovacao IS 'Data em que a venda foi aprovada (matriculada) pelo admin/secretaria';

-- Para vendas já aprovadas, definir data_aprovacao baseada em atualizado_em
UPDATE public.form_entries 
SET data_aprovacao = atualizado_em 
WHERE status = 'matriculado' AND data_aprovacao IS NULL;