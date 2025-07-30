-- Atualizar função update_venda_status_fast para incluir data_aprovacao
CREATE OR REPLACE FUNCTION public.update_venda_status_fast(venda_id_param uuid, novo_status text, pontuacao_param numeric DEFAULT NULL::numeric, motivo_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
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

    -- Preparar dados para atualização
    DECLARE
        update_data jsonb := jsonb_build_object(
            'status', novo_status,
            'atualizado_em', now()
        );
    BEGIN
        -- Se está aprovando (matriculando), adicionar data de aprovação
        IF novo_status = 'matriculado' THEN
            update_data := update_data || jsonb_build_object('data_aprovacao', now());
        END IF;
        
        -- Adicionar pontuação se fornecida
        IF pontuacao_param IS NOT NULL THEN
            update_data := update_data || jsonb_build_object('pontuacao_validada', pontuacao_param);
        END IF;
        
        -- Adicionar motivo se fornecido
        IF motivo_param IS NOT NULL THEN
            update_data := update_data || jsonb_build_object('motivo_pendencia', motivo_param);
        END IF;
    END;

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
$function$;