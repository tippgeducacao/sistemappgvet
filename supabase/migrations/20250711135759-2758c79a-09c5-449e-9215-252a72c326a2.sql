-- Alterar colunas de pontuação para DECIMAL
ALTER TABLE public.form_entries ALTER COLUMN pontuacao_esperada TYPE DECIMAL(5,2);
ALTER TABLE public.form_entries ALTER COLUMN pontuacao_validada TYPE DECIMAL(5,2);