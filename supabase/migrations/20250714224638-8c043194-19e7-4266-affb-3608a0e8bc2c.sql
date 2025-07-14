-- Corrigir sintaxe da função de criação de metas semanais

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
    fim_semana := primeira_terca + (week_counter - 1) * INTERVAL '7 days';
    
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