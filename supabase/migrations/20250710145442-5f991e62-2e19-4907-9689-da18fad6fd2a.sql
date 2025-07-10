-- Adicionar coluna modalidade à tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN modalidade TEXT NOT NULL DEFAULT 'Curso' 
CHECK (modalidade IN ('Curso', 'Pós-Graduação'));

-- Atualizar cursos existentes para terem modalidade 'Curso' por padrão
UPDATE public.cursos 
SET modalidade = 'Curso' 
WHERE modalidade IS NULL;