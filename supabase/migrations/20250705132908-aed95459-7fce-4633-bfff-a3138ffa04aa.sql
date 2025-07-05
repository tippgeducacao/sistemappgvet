
-- Adicionar campo user_id que está faltando na tabela lead_interactions
ALTER TABLE public.lead_interactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Criar foreign key entre alunos e form_entries se não existir
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id);

-- Atualizar foreign key para form_entries se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alunos_form_entry_id_fkey' 
        AND table_name = 'alunos'
    ) THEN
        ALTER TABLE public.alunos 
        ADD CONSTRAINT alunos_form_entry_id_fkey 
        FOREIGN KEY (form_entry_id) REFERENCES public.form_entries(id);
    END IF;
END $$;

-- Criar tabela historico_validacoes que está sendo referenciada mas não existe
CREATE TABLE IF NOT EXISTS public.historico_validacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_entry_id UUID REFERENCES public.form_entries(id) ON DELETE CASCADE,
    secretaria_id UUID REFERENCES auth.users(id),
    acao TEXT NOT NULL,
    descricao TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para historico_validacoes
ALTER TABLE public.historico_validacoes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que secretaria e admin vejam o histórico
CREATE POLICY "Secretaria and admin can view validation history" 
ON public.historico_validacoes 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'secretaria')
    )
);

-- Política para permitir que secretaria e admin criem registros de histórico
CREATE POLICY "Secretaria and admin can create validation history" 
ON public.historico_validacoes 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'secretaria')
    )
);

-- Criar função RPC update_venda_status que está sendo chamada
CREATE OR REPLACE FUNCTION public.update_venda_status(
    venda_id_param UUID,
    novo_status TEXT,
    pontuacao_param INTEGER DEFAULT NULL,
    motivo_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Atualizar políticas da tabela alunos para permitir relacionamento correto
DROP POLICY IF EXISTS "Users can view alunos" ON public.alunos;
CREATE POLICY "Users can view alunos" 
ON public.alunos 
FOR SELECT 
USING (
    -- Vendedor pode ver seus próprios alunos
    vendedor_id = auth.uid() OR
    -- Admin e secretaria podem ver todos
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'secretaria')
    )
);

-- Adicionar política de UPDATE para alunos
CREATE POLICY "Users can update alunos" 
ON public.alunos 
FOR UPDATE 
USING (
    vendedor_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'secretaria')
    )
);
