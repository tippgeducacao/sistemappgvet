-- Ajustar políticas RLS da tabela alunos para manter funcionalidades existentes
-- mas com segurança aprimorada

-- Remover políticas existentes
DROP POLICY IF EXISTS "Secretarias and admins can manage alunos" ON public.alunos;
DROP POLICY IF EXISTS "Secretarias and admins can view all alunos" ON public.alunos;
DROP POLICY IF EXISTS "Vendedores can create alunos" ON public.alunos;
DROP POLICY IF EXISTS "Vendedores can update their own alunos" ON public.alunos;
DROP POLICY IF EXISTS "Vendedores can view their own alunos" ON public.alunos;

-- Função para verificar se usuário pode acessar aluno
CREATE OR REPLACE FUNCTION public.can_access_aluno(aluno_vendedor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_type text;
BEGIN
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Diretores, admins e secretarias têm acesso total
  IF current_user_type IN ('diretor', 'admin', 'secretaria') THEN
    RETURN true;
  END IF;
  
  -- Vendedores e SDRs só podem acessar seus próprios alunos
  IF current_user_type IN ('vendedor', 'sdr') AND aluno_vendedor_id = auth.uid() THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Novas políticas RLS mais seguras mas funcionais

-- 1. SELECT: Usuários podem ver alunos conforme suas permissões
CREATE POLICY "Usuarios podem ver alunos conforme permissoes"
ON public.alunos
FOR SELECT
TO authenticated
USING (public.can_access_aluno(vendedor_id));

-- 2. INSERT: Vendedores e SDRs podem criar alunos para suas vendas
CREATE POLICY "Vendedores podem criar alunos"
ON public.alunos
FOR INSERT
TO authenticated
WITH CHECK (
  vendedor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('vendedor', 'sdr', 'admin', 'secretaria', 'diretor')
  )
);

-- 3. UPDATE: Apenas admins, secretarias e diretores podem atualizar
-- Vendedores podem atualizar apenas dados não sensíveis dos seus alunos
CREATE POLICY "Admins podem atualizar qualquer aluno"
ON public.alunos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

-- 4. Vendedores podem atualizar apenas data de matrícula dos seus alunos
CREATE POLICY "Vendedores podem atualizar data matricula"
ON public.alunos
FOR UPDATE
TO authenticated
USING (
  vendedor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('vendedor', 'sdr')
  )
)
WITH CHECK (
  vendedor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('vendedor', 'sdr')
  )
);

-- 5. DELETE: Apenas diretores podem deletar alunos
CREATE POLICY "Apenas diretores podem deletar alunos"
ON public.alunos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  )
);

-- Função para dados sanitizados de alunos (caso necessário no futuro)
CREATE OR REPLACE FUNCTION public.get_student_safe_data(student_id uuid)
RETURNS TABLE(
  id uuid,
  nome text,
  email_masked text,
  telefone_masked text,
  form_entry_id uuid,
  vendedor_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_user_type text;
BEGIN
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Se for admin, secretaria ou diretor, retorna dados completos
  IF current_user_type IN ('admin', 'secretaria', 'diretor') THEN
    RETURN QUERY
    SELECT 
      a.id,
      a.nome,
      a.email as email_masked,
      a.telefone as telefone_masked,
      a.form_entry_id,
      a.vendedor_id
    FROM public.alunos a
    WHERE a.id = student_id
    AND public.can_access_aluno(a.vendedor_id);
  ELSE
    -- Para outros usuários, mascarar dados sensíveis
    RETURN QUERY
    SELECT 
      a.id,
      a.nome,
      CASE 
        WHEN a.vendedor_id = auth.uid() THEN a.email
        ELSE regexp_replace(a.email, '(.{2}).*(@.*)', '\1***\2')
      END as email_masked,
      CASE 
        WHEN a.vendedor_id = auth.uid() THEN a.telefone
        ELSE regexp_replace(COALESCE(a.telefone, ''), '(.{2}).*(.{2})', '\1***\2')
      END as telefone_masked,
      a.form_entry_id,
      a.vendedor_id
    FROM public.alunos a
    WHERE a.id = student_id
    AND public.can_access_aluno(a.vendedor_id);
  END IF;
END;
$$;