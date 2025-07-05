
-- 1. Criar enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'secretaria', 'vendedor');

-- 2. Criar tabela de user_roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função security definer para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Criar função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- 6. Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" 
  ON public.user_roles 
  FOR ALL 
  USING (public.is_admin(auth.uid()));

-- 7. Atualizar políticas da tabela profiles para permitir admin ver todos
CREATE POLICY "Admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_admin(auth.uid()));

-- 8. Inserir o usuário admin (se ele já existir na tabela auth.users)
-- Nota: Este INSERT só funcionará se o usuário já tiver se cadastrado
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'admin'::app_role,
    au.id
FROM auth.users au 
WHERE au.email = 'wallasmonteiro019@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'secretaria'::app_role,
    au.id
FROM auth.users au 
WHERE au.email = 'wallasmonteiro019@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. Atualizar o perfil para secretaria se existir
UPDATE public.profiles 
SET user_type = 'secretaria'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'wallasmonteiro019@gmail.com'
);
