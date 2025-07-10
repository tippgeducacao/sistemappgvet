-- Adicionar foreign keys para estabelecer relacionamento correto entre form_entries e alunos

-- Primeiro, vamos garantir que os dados estejam consistentes
-- Atualizar form_entries.aluno_id baseado no relacionamento form_entry_id dos alunos
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

-- Adicionar foreign key de form_entries.aluno_id -> alunos.id
ALTER TABLE public.form_entries 
ADD CONSTRAINT fk_form_entries_aluno
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);

-- Adicionar foreign key de alunos.form_entry_id -> form_entries.id  
ALTER TABLE public.alunos 
ADD CONSTRAINT fk_alunos_form_entry
FOREIGN KEY (form_entry_id) REFERENCES public.form_entries(id);