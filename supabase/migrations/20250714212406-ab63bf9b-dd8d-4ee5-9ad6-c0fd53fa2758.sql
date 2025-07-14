-- Remover a tabela de metas mensais (não será mais necessária)
-- Comentário: As metas agora serão semanais e baseadas no nível do vendedor

-- A tabela metas_semanais_vendedores já existe e continuará sendo usada
-- Apenas vamos garantir que ela está configurada corretamente

-- Verificar se existe a função que cria metas semanais automaticamente
-- baseadas no nível do vendedor

CREATE OR REPLACE FUNCTION public.create_weekly_goals_for_vendor(
  p_vendedor_id UUID,
  p_ano INTEGER,
  p_mes INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_level TEXT;
  weekly_goal INTEGER;
  total_weeks INTEGER;
  week_counter INTEGER;
BEGIN
  -- Buscar o nível do vendedor
  SELECT nivel INTO vendor_level
  FROM profiles
  WHERE id = p_vendedor_id;
  
  -- Buscar a meta semanal baseada no nível
  SELECT meta_semanal_vendedor INTO weekly_goal
  FROM niveis_vendedores
  WHERE nivel = vendor_level;
  
  -- Se não encontrar o nível ou meta, usar padrão
  IF weekly_goal IS NULL THEN
    weekly_goal := 0;
  END IF;
  
  -- Calcular quantas semanas tem o mês (quarta a terça)
  total_weeks := public.get_weeks_in_month(p_ano, p_mes);
  
  -- Deletar metas semanais existentes para este vendedor/ano/mes
  DELETE FROM public.metas_semanais_vendedores 
  WHERE vendedor_id = p_vendedor_id 
    AND ano = p_ano 
    AND semana BETWEEN 1 AND total_weeks;
  
  -- Criar novas metas semanais baseadas no nível
  FOR week_counter IN 1..total_weeks LOOP
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

-- Função para gerar metas semanais para todos os vendedores de um mês
CREATE OR REPLACE FUNCTION public.generate_monthly_weekly_goals(
  p_ano INTEGER,
  p_mes INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_record RECORD;
BEGIN
  -- Para cada vendedor ativo, criar metas semanais
  FOR vendor_record IN 
    SELECT id
    FROM profiles
    WHERE user_type IN ('vendedor', 'sdr_inbound', 'sdr_outbound')
    AND ativo = true
  LOOP
    PERFORM public.create_weekly_goals_for_vendor(
      vendor_record.id,
      p_ano,
      p_mes
    );
  END LOOP;
END;
$$;