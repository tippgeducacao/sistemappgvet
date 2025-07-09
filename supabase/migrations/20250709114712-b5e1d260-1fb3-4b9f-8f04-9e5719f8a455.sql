-- 1. Criar o enum app_role
CREATE TYPE public.app_role AS ENUM ('admin', 'secretaria', 'vendedor', 'diretor');

-- 2. Criar função para identificar se é diretor
CREATE OR REPLACE FUNCTION public.is_diretor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'diretor'::text)
$$;

-- 3. Backup dos dados atuais da tabela user_roles
CREATE TEMP TABLE user_roles_backup AS SELECT * FROM public.user_roles;

-- 4. Recriar a tabela user_roles com o enum
DROP TABLE public.user_roles;

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid,
    UNIQUE(user_id, role)
);

-- 5. Restaurar os dados convertendo text para enum
INSERT INTO public.user_roles (id, user_id, role, created_at, created_by)
SELECT id, user_id, role::app_role, created_at, created_by 
FROM user_roles_backup;

-- 6. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Recriar as políticas
CREATE POLICY "Diretores can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

CREATE POLICY "Users can view user roles" 
  ON public.user_roles 
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);