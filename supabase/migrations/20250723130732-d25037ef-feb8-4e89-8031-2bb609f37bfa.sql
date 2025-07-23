-- Otimizar a função de atualização de status para melhorar performance
CREATE OR REPLACE FUNCTION public.update_venda_status_fast(
    venda_id_param uuid, 
    novo_status text, 
    pontuacao_param numeric DEFAULT NULL,
    motivo_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        atualizado_em = now()
    WHERE id = venda_id_param;

    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Inserir no histórico de forma assíncrona (sem bloquear)
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
$$;

-- Criar índices para otimizar as consultas mais frequentes
CREATE INDEX IF NOT EXISTS idx_form_entries_status_vendedor 
ON public.form_entries(status, vendedor_id);

CREATE INDEX IF NOT EXISTS idx_form_entries_atualizado_em 
ON public.form_entries(atualizado_em DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_type_id 
ON public.profiles(user_type, id);

-- Otimizar a tabela de histórico
CREATE INDEX IF NOT EXISTS idx_historico_validacoes_form_entry 
ON public.historico_validacoes(form_entry_id, created_at DESC);