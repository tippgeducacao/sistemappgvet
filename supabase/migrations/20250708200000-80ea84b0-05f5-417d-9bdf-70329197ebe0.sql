-- Remover a policy restritiva que impede vendedores de verem outros vendedores
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Criar nova policy que permite visualizar perfis de vendedores
CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

-- Manter a policy de update restrita ao próprio usuário
-- (Esta já existe, apenas documentando)