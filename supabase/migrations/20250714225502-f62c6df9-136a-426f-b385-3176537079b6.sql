-- Corrigir a lógica para excluir semanas que começam no mês mas terminam no próximo

CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano integer, mes integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  primeira_terca DATE;
  ultima_terca DATE;
  current_tuesday DATE;
  week_count INTEGER := 0;
BEGIN
  -- Encontrar a primeira terça-feira do mês
  primeira_terca := DATE(ano || '-' || mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP -- 2 = terça-feira
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Encontrar a última terça-feira do mês
  ultima_terca := (DATE(ano || '-' || mes || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  WHILE EXTRACT(DOW FROM ultima_terca) != 2 LOOP -- 2 = terça-feira
    ultima_terca := ultima_terca - INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
  -- verificar se existe uma semana anterior que termina neste mês
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    -- Verificar se a terça-feira anterior termina no mês atual
    primeira_terca := primeira_terca - INTERVAL '7 days';
    -- Se essa terça anterior não está no mês atual, voltar para a próxima
    IF EXTRACT(MONTH FROM primeira_terca) != mes OR EXTRACT(YEAR FROM primeira_terca) != ano THEN
      primeira_terca := primeira_terca + INTERVAL '7 days';
    END IF;
  END IF;
  
  -- Contar quantas terças-feiras estão no mês especificado, mas que não são a última do mês
  -- se ela for seguida por uma semana que termina no próximo mês
  current_tuesday := primeira_terca;
  WHILE EXTRACT(MONTH FROM current_tuesday) = mes AND EXTRACT(YEAR FROM current_tuesday) = ano LOOP
    -- Verificar se esta não é a última terça do mês seguida de uma que vai para o próximo mês
    IF current_tuesday = ultima_terca THEN
      -- Verificar se a próxima terça vai para o próximo mês
      DECLARE
        proxima_terca DATE := current_tuesday + INTERVAL '7 days';
      BEGIN
        -- Se a próxima terça está no próximo mês, não contar esta como última semana do mês atual
        IF EXTRACT(MONTH FROM proxima_terca) != mes OR EXTRACT(YEAR FROM proxima_terca) != ano THEN
          -- Esta é realmente a última semana do mês
          week_count := week_count + 1;
        END IF;
      END;
    ELSE
      week_count := week_count + 1;
    END IF;
    current_tuesday := current_tuesday + INTERVAL '7 days';
  END LOOP;
  
  RETURN week_count;
END;
$$;