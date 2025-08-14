-- Fix critical database function security by adding search_path protection
-- This prevents potential SQL injection through search path manipulation

-- 1. Fix critical authentication and security functions first
CREATE OR REPLACE FUNCTION public.can_access_aluno(aluno_vendedor_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = $1 AND role = role_name
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = $1 AND role = 'admin'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_diretor(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'diretor'
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_type()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_type_result TEXT;
BEGIN
  SELECT user_type INTO user_type_result 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_type_result, 'vendedor');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_venda_status_fast(venda_id_param uuid, novo_status text, pontuacao_param numeric DEFAULT NULL::numeric, motivo_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Verificar permissão de forma otimizada
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'secretaria', 'diretor')
        LIMIT 1
    ) THEN
        RETURN FALSE;
    END IF;

    -- Atualizar apenas os campos necessários de forma otimizada
    UPDATE public.form_entries 
    SET 
        status = novo_status,
        pontuacao_validada = COALESCE(pontuacao_param, pontuacao_validada),
        motivo_pendencia = motivo_param,
        atualizado_em = now(),
        data_aprovacao = CASE 
            WHEN novo_status = 'matriculado' THEN now() 
            ELSE data_aprovacao 
        END
    WHERE id = venda_id_param;

    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Inserir no histórico de forma assíncrona
    INSERT INTO public.historico_validacoes (
        form_entry_id, 
        secretaria_id, 
        acao, 
        descricao
    ) VALUES (
        venda_id_param,
        auth.uid(),
        'status_alterado_fast',
        CONCAT('Status alterado para: ', novo_status, 
               CASE WHEN motivo_param IS NOT NULL THEN CONCAT('. Motivo: ', motivo_param) ELSE '' END)
    );

    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_venda_status(venda_id_param uuid, novo_status text, pontuacao_param integer DEFAULT NULL::integer, motivo_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Verificar se o usuário tem permissão (admin ou secretaria)
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'secretaria')
    ) THEN
        RETURN FALSE;
    END IF;

    -- Atualizar a form_entry
    UPDATE public.form_entries 
    SET 
        status = novo_status,
        pontuacao_validada = COALESCE(pontuacao_param, pontuacao_validada),
        motivo_pendencia = motivo_param,
        atualizado_em = now()
    WHERE id = venda_id_param;

    -- Registrar no histórico
    INSERT INTO public.historico_validacoes (
        form_entry_id, 
        secretaria_id, 
        acao, 
        descricao
    ) VALUES (
        venda_id_param,
        auth.uid(),
        'status_alterado',
        CONCAT('Status alterado para: ', novo_status, 
               CASE WHEN motivo_param IS NOT NULL THEN CONCAT('. Motivo: ', motivo_param) ELSE '' END)
    );

    RETURN TRUE;
END;
$function$;

-- 2. Add missing RLS policies for historico_validacoes table
ALTER TABLE public.historico_validacoes ENABLE ROW LEVEL SECURITY;

-- Allow admins, secretarias and diretores to view all validation history
CREATE POLICY "Admins podem ver todo histórico de validações"
ON public.historico_validacoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

-- Allow admins, secretarias and diretores to create validation history entries
CREATE POLICY "Admins podem criar entradas no histórico"
ON public.historico_validacoes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

-- Allow users to see their own validation actions
CREATE POLICY "Usuários podem ver suas próprias ações"
ON public.historico_validacoes
FOR SELECT
TO authenticated
USING (secretaria_id = auth.uid());

-- 3. Fix remaining critical functions with search_path
CREATE OR REPLACE FUNCTION public.get_student_safe_data(student_id uuid)
 RETURNS TABLE(id uuid, nome text, email_masked text, telefone_masked text, form_entry_id uuid, vendedor_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.delete_venda_cascade(venda_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Deletar respostas do formulário
    DELETE FROM public.respostas_formulario WHERE form_entry_id = venda_id;
    
    -- Deletar aluno associado
    DELETE FROM public.alunos WHERE form_entry_id = venda_id;
    
    -- Deletar form_entry principal
    DELETE FROM public.form_entries WHERE id = venda_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$function$;