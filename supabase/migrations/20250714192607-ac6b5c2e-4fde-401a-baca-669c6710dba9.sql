-- Primeiro, salvar os dados existentes
CREATE TEMP TABLE temp_user_roles AS 
SELECT id, user_id, role::text as role_text, created_at, created_by 
FROM public.user_roles;

-- Dropar e recriar o enum
DROP TYPE public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'secretaria', 
  'vendedor',
  'diretor',
  'sdr_inbound',
  'sdr_outbound'
);

-- Recriar a tabela user_roles
DROP TABLE public.user_roles;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

-- Restaurar os dados
INSERT INTO public.user_roles (id, user_id, role, created_at, created_by)
SELECT id, user_id, role_text::public.app_role, created_at, created_by
FROM temp_user_roles;

-- Recriar as políticas RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diretores can manage all roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'diretor'
  )
);

CREATE POLICY "Users can view user roles" ON public.user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- Criar função para verificar se é diretor
CREATE OR REPLACE FUNCTION public.is_diretor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'diretor'
  );
$$;