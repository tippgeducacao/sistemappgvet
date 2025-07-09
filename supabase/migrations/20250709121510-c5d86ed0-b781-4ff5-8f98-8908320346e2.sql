-- Remover política atual que permite usuários atualizarem seus próprios perfis
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Remover outras políticas relacionadas a updates se existirem
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Secretarias can update vendor photos" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update vendor photos via roles" ON public.profiles;

-- Criar nova política que permite apenas admins, secretárias e diretores atualizarem fotos de perfil
CREATE POLICY "Only admins can update profiles" ON public.profiles
FOR UPDATE USING (
  -- Verificar se o usuário tem role de admin, secretaria ou diretor
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'secretaria', 'diretor')
  )
  OR 
  -- Ou se o usuário tem user_type secretaria (fallback para compatibilidade)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type IN ('secretaria', 'admin')
  )
);