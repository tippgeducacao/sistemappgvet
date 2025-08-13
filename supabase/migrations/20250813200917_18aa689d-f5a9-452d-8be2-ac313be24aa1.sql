-- Buscar um usuário diretor para definir como criador do evento
DO $$
DECLARE
    diretor_id UUID;
BEGIN
    -- Buscar o primeiro usuário diretor
    SELECT id INTO diretor_id 
    FROM public.profiles 
    WHERE user_type = 'diretor' 
    LIMIT 1;
    
    -- Se não encontrar diretor, buscar admin
    IF diretor_id IS NULL THEN
        SELECT id INTO diretor_id 
        FROM public.profiles 
        WHERE user_type = 'admin' 
        LIMIT 1;
    END IF;
    
    -- Se encontrou um usuário válido, criar o evento
    IF diretor_id IS NOT NULL THEN
        INSERT INTO public.eventos_especiais (
            titulo,
            descricao,
            data_inicio,
            data_fim,
            is_recorrente,
            tipo_recorrencia,
            dias_semana,
            hora_inicio,
            hora_fim,
            data_inicio_recorrencia,
            data_fim_recorrencia,
            created_by
        ) VALUES (
            'Reunião de alinhamento',
            'Reunião semanal de alinhamento da equipe realizada toda quarta-feira',
            '2025-01-01T14:00:00',
            '2025-12-31T15:00:00',
            true,
            'semanal',
            ARRAY[3], -- 3 = quarta-feira (0=domingo, 1=segunda, 2=terça, 3=quarta, etc.)
            '14:00',
            '15:00',
            '2025-01-01',
            '2025-12-31',
            diretor_id
        );
    END IF;
END $$;