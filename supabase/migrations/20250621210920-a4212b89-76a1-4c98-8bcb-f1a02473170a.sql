
-- Remover a constraint incorreta e criar a correta
ALTER TABLE public.form_entries 
DROP CONSTRAINT IF EXISTS form_entries_vendedor_id_fkey;

-- Adicionar constraint correta apontando para auth.users
ALTER TABLE public.form_entries 
ADD CONSTRAINT form_entries_vendedor_id_fkey 
FOREIGN KEY (vendedor_id) REFERENCES auth.users(id);

-- Fazer o mesmo para a tabela alunos se necessário
ALTER TABLE public.alunos 
DROP CONSTRAINT IF EXISTS alunos_vendedor_id_fkey;

ALTER TABLE public.alunos 
ADD CONSTRAINT alunos_vendedor_id_fkey 
FOREIGN KEY (vendedor_id) REFERENCES auth.users(id);
