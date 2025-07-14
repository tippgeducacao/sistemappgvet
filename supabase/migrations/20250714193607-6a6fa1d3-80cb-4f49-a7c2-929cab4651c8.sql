-- Corrigir políticas RLS da tabela user_roles para evitar recursão infinita

-- Remover política problemática
DROP POLICY IF EXISTS "Diretores can manage all roles" ON public.user_roles;

-- Criar nova política usando o perfil do usuário diretamente (sem recursão)
CREATE POLICY "Diretores can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  )
);

-- Política adicional para admins também poderem gerenciar roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);