-- Corrigir permissões do diretor para igualar ao admin

-- 1. Atualizar política de histórico de validações para incluir diretor
DROP POLICY IF EXISTS "Secretaria and admin can create validation history" ON historico_validacoes;
DROP POLICY IF EXISTS "Secretaria and admin can view validation history" ON historico_validacoes;

-- Criar nova política para INSERT que inclui diretor
CREATE POLICY "Secretaria admin and diretor can create validation history" 
ON historico_validacoes
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'
  )
);

-- Criar nova política para SELECT que inclui diretor
CREATE POLICY "Secretaria admin and diretor can view validation history" 
ON historico_validacoes
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'
  )
);

-- 2. Atualizar política de regras de pontuação para incluir diretor
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON regras_pontuacao;

-- Criar nova política que inclui diretor
CREATE POLICY "Admins and diretor can manage scoring rules" 
ON regras_pontuacao
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'
  )
);