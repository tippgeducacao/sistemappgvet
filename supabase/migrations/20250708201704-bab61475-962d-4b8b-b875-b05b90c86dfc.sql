
-- 1. Adicionar 'diretor' ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'diretor';

-- 2. Inserir o usuário diretor (será criado quando ele fizer login)
-- Por enquanto, vamos apenas preparar a estrutura

-- 3. Criar função para identificar se é diretor
CREATE OR REPLACE FUNCTION public.is_diretor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'diretor'::app_role)
$$;

-- 4. Atualizar políticas para dar acesso total aos diretores em tabelas críticas

-- Política para regras_pontuacao - apenas diretores podem gerenciar
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON public.regras_pontuacao;
CREATE POLICY "Diretores can manage scoring rules" 
  ON public.regras_pontuacao 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

-- Política para user_roles - diretores podem gerenciar roles
CREATE POLICY "Diretores can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

-- Política para profiles - diretores podem ver todos os perfis
CREATE POLICY "Diretores can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_diretor(auth.uid()));

-- Política para cursos - diretores podem gerenciar todos
CREATE POLICY "Diretores can manage all courses" 
  ON public.cursos 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

-- Política para form_entries - diretores podem ver e gerenciar todas
CREATE POLICY "Diretores can manage all form entries" 
  ON public.form_entries 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

-- Política para alunos - diretores podem ver todos
CREATE POLICY "Diretores can view all alunos" 
  ON public.alunos 
  FOR SELECT 
  USING (public.is_diretor(auth.uid()));

-- Política para leads - diretores podem gerenciar todos
CREATE POLICY "Diretores can manage all leads" 
  ON public.leads 
  FOR ALL 
  USING (public.is_diretor(auth.uid()));

-- 5. Inserir o perfil do diretor quando ele existir
-- (será executado via trigger quando o usuário fizer signup)

-- 6. Comentário para lembrar de adicionar o role manualmente após o usuário se cadastrar
-- INSERT INTO public.user_roles (user_id, role, created_by)
-- SELECT au.id, 'diretor'::app_role, au.id
-- FROM auth.users au 
-- WHERE au.email = 'ti@ppg.com'
-- ON CONFLICT (user_id, role) DO NOTHING;
