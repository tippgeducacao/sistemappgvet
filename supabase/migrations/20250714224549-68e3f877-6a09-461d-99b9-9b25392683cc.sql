-- Corrigir a lógica de semanas para que cada semana pertença ao mês em que termina (terça-feira)

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.get_weeks_in_month(integer, integer);

-- Criar nova função que calcula semanas baseadas no fim da semana (terça-feira)
CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano integer, mes integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  primeira_terca DATE;
  ultima_terca DATE;
  primeira_quarta DATE;
  ultima_quarta DATE;
  semanas INTEGER;
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
  
  -- Se a primeira terça-feira é após o dia 7, verificar se há uma semana anterior que termina no mês
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    -- Verificar se a terça-feira anterior existe e se a semana que termina nela conta para este mês
    primeira_quarta := primeira_terca - INTERVAL '6 days'; -- Quarta anterior
    IF EXTRACT(MONTH FROM primeira_quarta) != mes THEN
      -- A semana anterior termina neste mês, então contar
      primeira_terca := primeira_terca - INTERVAL '7 days';
    END IF;
  END IF;
  
  -- Calcular número de semanas (cada semana vai de quarta a terça)
  semanas := FLOOR((ultima_terca - primeira_terca) / 7.0) + 1;
  
  -- Garantir que tenha pelo menos 4 semanas e no máximo 6
  IF semanas < 4 THEN
    semanas := 4;
  ELSIF semanas > 6 THEN
    semanas := 6;
  END IF;
  
  RETURN semanas;
END;
$$;

-- Atualizar função de gerenciamento de metas semanais para usar a nova lógica
CREATE OR REPLACE FUNCTION public.create_weekly_goals_for_vendor(p_vendedor_id uuid, p_ano integer, p_mes integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_level TEXT;
  weekly_goal INTEGER;
  total_weeks INTEGER;
  week_counter INTEGER;
  primeira_terca DATE;
  fim_semana DATE;
  semana_mes INTEGER;
BEGIN
  -- Buscar o nível do vendedor
  SELECT nivel INTO vendor_level
  FROM profiles
  WHERE id = p_vendedor_id;
  
  -- Buscar a meta semanal baseada no nível do vendedor
  SELECT meta_semanal_vendedor INTO weekly_goal
  FROM niveis_vendedores
  WHERE nivel = vendor_level AND tipo_usuario = 'vendedor';
  
  -- Se não encontrar o nível ou meta, usar padrão
  IF weekly_goal IS NULL THEN
    weekly_goal := 0;
  END IF;
  
  -- Calcular quantas semanas tem o mês
  total_weeks := public.get_weeks_in_month(p_ano, p_mes);
  
  -- Deletar metas semanais existentes para este vendedor/ano/mes
  DELETE FROM public.metas_semanais_vendedores 
  WHERE vendedor_id = p_vendedor_id 
    AND ano = p_ano;
  
  -- Encontrar a primeira terça-feira que conta para este mês
  primeira_terca := DATE(p_ano || '-' || p_mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça é muito tarde no mês, pegar a anterior
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    primeira_terca := primeira_terca - INTERVAL '7 days';
  END IF;
  
  -- Criar metas semanais baseadas nas terças-feiras que terminam no mês
  FOR week_counter IN 1..total_weeks LOOP
    fim_semana := primeira_terca + INTERVAL ((week_counter - 1) * 7) || ' days';
    
    -- Verificar se esta terça-feira está no mês correto
    IF EXTRACT(MONTH FROM fim_semana) = p_mes AND EXTRACT(YEAR FROM fim_semana) = p_ano THEN
      semana_mes := week_counter;
    ELSE
      -- Se a terça não está no mês, calcular qual mês ela pertence
      semana_mes := week_counter;
    END IF;
    
    INSERT INTO public.metas_semanais_vendedores (
      vendedor_id, 
      ano, 
      semana, 
      meta_vendas, 
      created_by
    ) VALUES (
      p_vendedor_id,
      p_ano,
      week_counter,
      weekly_goal,
      auth.uid()
    );
  END LOOP;
END;
$$;