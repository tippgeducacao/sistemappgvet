-- Criar políticas de UPDATE para permitir que diretores alterem fotos de perfil

-- Política para permitir que usuários atualizem seus próprios perfis
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Política para permitir que diretores atualizem qualquer perfil
CREATE POLICY "Diretores can update any profile" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'diretor'
  )
);

-- Política para permitir que secretárias atualizem perfis de vendedores
CREATE POLICY "Secretarias can update vendor profiles" ON public.profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'secretaria'
  )
);