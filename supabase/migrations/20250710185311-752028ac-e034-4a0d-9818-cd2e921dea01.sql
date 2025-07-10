-- Atualizar política de visualização da tabela alunos para incluir diretores
DROP POLICY IF EXISTS "Users can view alunos" ON alunos;

-- Criar nova política que inclui diretores
CREATE POLICY "Users can view alunos" 
ON alunos
FOR SELECT 
USING (
  vendedor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['admin', 'secretaria'])
  )
  OR EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'secretaria'::app_role, 'diretor'::app_role])
  )
);

-- Atualizar política de atualização da tabela alunos para incluir diretores  
DROP POLICY IF EXISTS "Users can update alunos" ON alunos;

CREATE POLICY "Users can update alunos" 
ON alunos
FOR UPDATE 
USING (
  vendedor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['admin', 'secretaria'])
  )
  OR EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin'::app_role, 'secretaria'::app_role, 'diretor'::app_role])
  )
);