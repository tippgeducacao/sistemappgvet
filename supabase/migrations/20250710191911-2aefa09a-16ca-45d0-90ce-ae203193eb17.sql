-- Corrigir relacionamentos entre form_entries e alunos
-- Criar foreign keys que estão faltando

-- Primeiro garantir consistência dos dados
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

-- Criar foreign key de form_entries.aluno_id para alunos.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_form_entries_aluno' 
    AND table_name = 'form_entries'
  ) THEN
    ALTER TABLE public.form_entries 
    ADD CONSTRAINT fk_form_entries_aluno
    FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);
  END IF;
END $$;

-- Criar foreign key de alunos.form_entry_id para form_entries.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_alunos_form_entry' 
    AND table_name = 'alunos'
  ) THEN
    ALTER TABLE public.alunos 
    ADD CONSTRAINT fk_alunos_form_entry
    FOREIGN KEY (form_entry_id) REFERENCES public.form_entries(id);
  END IF;
END $$;