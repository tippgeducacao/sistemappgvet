-- Corrigir política RLS para incluir diretores na criação de cursos
-- O problema é que as políticas atuais só verificam user_type 'admin' e 'secretaria'
-- Mas não incluem usuários com role 'diretor'

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admins can create courses" ON public.cursos;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.cursos;

-- Criar política para INSERT que inclui diretores
CREATE POLICY "Admins can create courses" 
ON public.cursos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);

-- Criar política para UPDATE que inclui diretores
CREATE POLICY "Admins can update courses" 
ON public.cursos 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);

-- Criar política para DELETE que inclui diretores
CREATE POLICY "Admins can delete courses" 
ON public.cursos 
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);