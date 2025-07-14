-- Recriar o enum app_role com todas as roles
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'secretaria', 
  'vendedor',
  'diretor',
  'sdr_inbound',
  'sdr_outbound'
);

-- Recriar a tabela user_roles com o enum atualizado
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;