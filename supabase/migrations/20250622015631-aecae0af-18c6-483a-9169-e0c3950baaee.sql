
-- Verificar e corrigir as políticas RLS para garantir que a secretaria veja todas as vendas

-- Política para form_entries - secretaria deve ver todas as vendas
DROP POLICY IF EXISTS "Secretaria can view all entries" ON public.form_entries;
CREATE POLICY "Secretaria can view all entries" ON public.form_entries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'secretaria'
  )
);

-- Política para alunos - secretaria deve ver todos os alunos
DROP POLICY IF EXISTS "Secretaria can view all alunos" ON public.alunos;
CREATE POLICY "Secretaria can view all alunos" ON public.alunos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'secretaria'
  )
);

-- Política para cursos - secretaria deve ver todos os cursos
DROP POLICY IF EXISTS "Secretaria can view all cursos" ON public.cursos;
CREATE POLICY "Secretaria can view all cursos" ON public.cursos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'secretaria'
  )
);

-- Habilitar RLS nas tabelas se não estiver habilitado
ALTER TABLE public.form_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
