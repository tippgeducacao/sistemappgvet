-- Corrigir recursão infinita nas políticas RLS da tabela profiles
-- Primeiro, remover todas as políticas que estão causando recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Management can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view team profiles" ON public.profiles;

-- Criar função security definer para verificar tipo de usuário sem recursão
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
DECLARE
  user_type_result TEXT;
BEGIN
  SELECT user_type INTO user_type_result 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_type_result, 'vendedor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar políticas seguras usando a função security definer
-- 1. Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Administradores, secretárias e diretores podem ver todos os perfis
CREATE POLICY "Management can view all profiles" ON public.profiles
  FOR SELECT  
  USING (public.get_current_user_type() IN ('admin', 'secretaria', 'diretor'));

-- 3. Supervisores podem ver todos os perfis (para gestão)
CREATE POLICY "Supervisors can view team profiles" ON public.profiles
  FOR SELECT
  USING (public.get_current_user_type() = 'supervisor');

-- Manter as políticas de UPDATE existentes que já estão corretas