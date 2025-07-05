
-- Adicionar coluna photo_url na tabela profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Adicionar coluna enviado_em na tabela form_entries se não existir
ALTER TABLE public.form_entries 
ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar tabela alunos com form_entry_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alunos' AND column_name = 'form_entry_id') THEN
        ALTER TABLE public.alunos 
        ADD COLUMN form_entry_id UUID REFERENCES public.form_entries(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar função para deletar venda em cascata
CREATE OR REPLACE FUNCTION public.delete_venda_cascade(venda_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = $1 AND role = 'admin'
    );
END;
$$;

-- Criar função para verificar roles de usuário
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = $1 AND role = role_name
    );
END;
$$;
