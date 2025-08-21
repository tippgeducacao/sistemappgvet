-- Corrigir todas as políticas RLS que podem causar recursão infinita na tabela profiles

-- Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "Diretores can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view team profiles" ON public.profiles;
DROP POLICY IF EXISTS "Vendedores podem ver dados básicos dos SDRs" ON public.profiles;

-- Recriar as políticas usando apenas as funções security definer

-- 1. Política para diretores atualizarem qualquer perfil
CREATE POLICY "Diretores can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_management_user())
WITH CHECK (public.is_management_user());

-- 2. Política simplificada para supervisores visualizarem perfis da equipe
CREATE POLICY "Supervisors can view team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  public.is_management_user() OR
  (
    public.is_supervisor_user() AND 
    user_type IN ('vendedor', 'sdr', 'sdr_inbound', 'sdr_outbound')
  ) OR
  (
    public.is_vendedor_user() AND 
    user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')
  ) OR
  (
    public.is_sdr_user() AND 
    user_type = 'vendedor'
  )
);

-- 3. Política simplificada para vendedores visualizarem dados básicos dos SDRs
CREATE POLICY "Vendedores podem ver dados básicos dos SDRs"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  (public.is_vendedor_user() AND user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')) OR
  (public.is_sdr_user() AND user_type = 'vendedor')
);