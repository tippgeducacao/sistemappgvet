-- Atualizar a função RPC para limpar data_assinatura_contrato quando necessário
CREATE OR REPLACE FUNCTION public.update_venda_status_fast(
    venda_id_param UUID,
    novo_status TEXT,
    pontuacao_param NUMERIC DEFAULT NULL,
    motivo_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
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
        atualizado_em = now(),
        data_aprovacao = CASE 
            WHEN novo_status = 'matriculado' THEN now() 
            WHEN novo_status IN ('pendente', 'desistiu') THEN NULL
            ELSE data_aprovacao 
        END,
        data_assinatura_contrato = CASE 
            WHEN novo_status IN ('pendente', 'desistiu') THEN NULL
            ELSE data_assinatura_contrato 
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
$$;