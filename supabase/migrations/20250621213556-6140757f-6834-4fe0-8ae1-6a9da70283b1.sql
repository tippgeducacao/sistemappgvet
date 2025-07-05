
-- Corrigir o problema de relacionamento entre form_entries e alunos
-- Primeiro, vamos verificar e corrigir as foreign keys

-- Remover constraints problemáticas se existirem
ALTER TABLE public.form_entries 
DROP CONSTRAINT IF EXISTS form_entries_vendedor_id_fkey;

ALTER TABLE public.alunos 
DROP CONSTRAINT IF EXISTS alunos_vendedor_id_fkey;

-- Adicionar constraints corretas
ALTER TABLE public.form_entries 
ADD CONSTRAINT form_entries_vendedor_id_fkey 
FOREIGN KEY (vendedor_id) REFERENCES auth.users(id);

ALTER TABLE public.alunos 
ADD CONSTRAINT alunos_vendedor_id_fkey 
FOREIGN KEY (vendedor_id) REFERENCES auth.users(id);

-- Garantir que a relação entre form_entries e alunos esteja correta
ALTER TABLE public.form_entries 
DROP CONSTRAINT IF EXISTS form_entries_aluno_id_fkey;

ALTER TABLE public.form_entries 
ADD CONSTRAINT form_entries_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);

-- Verificar se há dados órfãos e corrigir
UPDATE public.form_entries 
SET aluno_id = (
  SELECT a.id 
  FROM public.alunos a 
  WHERE a.form_entry_id = form_entries.id 
  LIMIT 1
) 
WHERE aluno_id IS NULL 
AND EXISTS (
  SELECT 1 FROM public.alunos a 
  WHERE a.form_entry_id = form_entries.id
);
