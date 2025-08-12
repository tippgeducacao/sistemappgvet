-- Corrigir vulnerabilidade de segurança na tabela profiles
-- Remover política insegura que permite acesso total
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Criar políticas mais restritivas para proteger dados dos funcionários
-- 1. Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Administradores, secretárias e diretores podem ver todos os perfis (para gestão)
CREATE POLICY "Management can view all profiles" ON public.profiles
  FOR SELECT  
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type IN ('admin', 'secretaria', 'diretor')
  ));

-- 3. Supervisores podem ver perfis dos membros de suas equipes
-- (Para implementação futura quando houver estrutura de equipes)
CREATE POLICY "Supervisors can view team profiles" ON public.profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'supervisor'
    -- Por enquanto supervisores podem ver todos os perfis até implementarmos estrutura de equipes
  ));

-- Garantir que as políticas de atualização também sejam seguras
-- Manter as políticas de UPDATE existentes que já estão corretas