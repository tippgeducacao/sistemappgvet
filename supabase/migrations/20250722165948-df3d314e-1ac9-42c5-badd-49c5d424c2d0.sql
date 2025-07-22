-- Adicionar colunas turma e abertura à tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN turma TEXT,
ADD COLUMN abertura TEXT;