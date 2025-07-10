-- Corrigir política RLS para criação de cursos
-- A política atual está funcionando, mas o campo criado_por não está sendo preenchido

-- Primeiro, vamos verificar se existe uma política INSERT específica
DROP POLICY IF EXISTS "Admins can create courses" ON public.cursos;

-- Criar política específica para INSERT
CREATE POLICY "Admins can create courses" 
ON public.cursos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);

-- Atualizar a política existente para excluir INSERT (deixar só UPDATE e DELETE)
DROP POLICY IF EXISTS "Admins can manage courses" ON public.cursos;

CREATE POLICY "Admins can manage courses" 
ON public.cursos 
FOR UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);