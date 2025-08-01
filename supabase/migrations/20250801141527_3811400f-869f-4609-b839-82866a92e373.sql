-- Permitir que diretores vejam todos os agendamentos
CREATE POLICY "Diretores podem ver todos os agendamentos" 
ON agendamentos 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'diretor'
  )
);

-- Permitir que diretores editem todos os agendamentos (incluindo trocar vendedor)
CREATE POLICY "Diretores podem editar todos os agendamentos" 
ON agendamentos 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'diretor'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'diretor'
  )
);