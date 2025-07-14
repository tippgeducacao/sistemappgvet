-- Abordagem mais simples: contar apenas terças que estão completamente no mês

CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano integer, mes integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  primeira_terca DATE;
  ultima_data_mes DATE;
  current_tuesday DATE;
  week_count INTEGER := 0;
BEGIN
  -- Último dia do mês
  ultima_data_mes := (DATE(ano || '-' || mes || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Encontrar a primeira terça-feira do mês
  primeira_terca := DATE(ano || '-' || mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP -- 2 = terça-feira
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
  -- verificar se existe uma semana anterior que termina neste mês
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    primeira_terca := primeira_terca - INTERVAL '7 days';
    -- Se essa terça anterior não está no mês atual, voltar para a próxima
    IF EXTRACT(MONTH FROM primeira_terca) != mes OR EXTRACT(YEAR FROM primeira_terca) != ano THEN
      primeira_terca := primeira_terca + INTERVAL '7 days';
    END IF;
  END IF;
  
  -- Contar terças que estão no mês, mas excluir a última se ela está muito próxima do fim
  current_tuesday := primeira_terca;
  WHILE EXTRACT(MONTH FROM current_tuesday) = mes AND EXTRACT(YEAR FROM current_tuesday) = ano LOOP
    -- Para julho 2025: se a terça é 29/07, verificar se sobram menos de 3 dias do mês
    IF (ultima_data_mes::date - current_tuesday::date) >= 3 OR current_tuesday < (ultima_data_mes - INTERVAL '6 days') THEN
      week_count := week_count + 1;
    END IF;
    current_tuesday := current_tuesday + INTERVAL '7 days';
  END LOOP;
  
  RETURN week_count;
END;
$$;