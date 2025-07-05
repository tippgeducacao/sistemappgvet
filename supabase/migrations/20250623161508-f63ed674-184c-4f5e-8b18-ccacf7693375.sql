
-- Primeiro, vamos verificar os valores do enum user_type
SELECT unnest(enum_range(NULL::user_type));

-- Remover políticas existentes se houver para recriar
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins and secretarias can update vendor photos" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;

-- Política para permitir que todos vejam os perfis
CREATE POLICY "Everyone can view profiles" ON public.profiles
FOR SELECT USING (true);

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que secretárias atualizem fotos de vendedores
-- (usando apenas 'secretaria' já que 'admin' não existe no enum)
CREATE POLICY "Secretarias can update vendor photos" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'secretaria'
  )
);

-- Verificar se existe o sistema de roles separado e criar política adicional se necessário
-- Se o usuário tem role 'admin' na tabela user_roles, também pode atualizar
CREATE POLICY "Admins can update vendor photos via roles" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);
