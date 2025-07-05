
-- Corrigir dados existentes: vincular alunos às suas form_entries baseado no form_entry_id
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

-- Verificar se há form_entries órfãos (sem aluno associado)
-- e criar logs para debug
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.form_entries fe
  WHERE fe.aluno_id IS NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.alunos a 
    WHERE a.form_entry_id = fe.id
  );
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Encontradas % form_entries sem aluno associado', orphan_count;
  END IF;
END $$;
