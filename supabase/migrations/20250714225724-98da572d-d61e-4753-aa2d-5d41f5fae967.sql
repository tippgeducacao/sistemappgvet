-- Corrigir a função para remover registros antigos e criar apenas as semanas corretas

CREATE OR REPLACE FUNCTION public.create_weekly_goals_for_vendor(p_vendedor_id uuid, p_ano integer, p_mes integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_level TEXT;
  weekly_goal INTEGER;
  week_counter INTEGER;
  primeira_terca DATE;
  current_tuesday DATE;
  ultima_data_mes DATE;
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
  
  -- Deletar TODAS as metas semanais existentes para este vendedor/ano (não só do mês)
  DELETE FROM public.metas_semanais_vendedores 
  WHERE vendedor_id = p_vendedor_id 
    AND ano = p_ano;
  
  -- Último dia do mês
  ultima_data_mes := (DATE(p_ano || '-' || p_mes || '-01') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Encontrar a primeira terça-feira do mês
  primeira_terca := DATE(p_ano || '-' || p_mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça é muito tarde no mês, verificar a anterior
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    primeira_terca := primeira_terca - INTERVAL '7 days';
    -- Se essa terça anterior não está no mês atual, voltar para a próxima
    IF EXTRACT(MONTH FROM primeira_terca) != p_mes OR EXTRACT(YEAR FROM primeira_terca) != p_ano THEN
      primeira_terca := primeira_terca + INTERVAL '7 days';
    END IF;
  END IF;
  
  -- Criar metas apenas para semanas que terminam no mês especificado
  current_tuesday := primeira_terca;
  week_counter := 1;
  
  WHILE EXTRACT(MONTH FROM current_tuesday) = p_mes AND EXTRACT(YEAR FROM current_tuesday) = p_ano LOOP
    -- Aplicar a mesma lógica da função get_weeks_in_month para excluir semanas que terminam muito próximo do fim
    IF (ultima_data_mes::date - current_tuesday::date) >= 3 OR current_tuesday < (ultima_data_mes - INTERVAL '6 days') THEN
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
      
      week_counter := week_counter + 1;
    END IF;
    current_tuesday := current_tuesday + INTERVAL '7 days';
  END LOOP;
END;
$$;