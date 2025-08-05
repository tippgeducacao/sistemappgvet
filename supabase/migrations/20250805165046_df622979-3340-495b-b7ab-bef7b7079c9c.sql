-- Adicionar política para admins e secretarias verem todos os cursos
CREATE POLICY "Admins e secretarias podem ver todos os cursos" 
ON public.cursos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);

-- Verificar as políticas atualizadas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cursos' 
ORDER BY cmd, policyname;