-- Atualizar função para calcular semanas corretamente (quarta a terça)
DROP FUNCTION IF EXISTS public.get_weeks_in_month(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano INTEGER, mes INTEGER)
RETURNS INTEGER AS $$
DECLARE
  primeiro_dia DATE;
  ultimo_dia DATE;
  primeira_quarta DATE;
  ultima_terca DATE;
  semanas INTEGER;
BEGIN
  -- Primeiro e último dia do mês
  primeiro_dia := DATE(ano || '-' || mes || '-01');
  ultimo_dia := (primeiro_dia + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Encontrar a primeira quarta-feira do mês (ou antes se necessário)
  primeira_quarta := primeiro_dia;
  WHILE EXTRACT(DOW FROM primeira_quarta) != 3 LOOP -- 3 = quarta-feira
    primeira_quarta := primeira_quarta - INTERVAL '1 day';
  END LOOP;
  
  -- Encontrar a última terça-feira do mês (ou depois se necessário)  
  ultima_terca := ultimo_dia;
  WHILE EXTRACT(DOW FROM ultima_terca) != 2 LOOP -- 2 = terça-feira
    ultima_terca := ultima_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Calcular número de semanas (quarta a terça = 7 dias)
  semanas := CEIL((ultima_terca - primeira_quarta + 1) / 7.0);
  
  -- Garantir que tenha pelo menos 4 semanas
  IF semanas < 4 THEN
    semanas := 4;
  END IF;
  
  RETURN semanas;
END;
$$ LANGUAGE plpgsql STABLE;

-- Atualizar função para gerenciar metas semanais com semanas corretas (quarta a terça)
CREATE OR REPLACE FUNCTION public.manage_weekly_goals()
RETURNS TRIGGER AS $$
DECLARE
  total_weeks INTEGER;
  weekly_goal INTEGER;
  remaining_goal INTEGER;
  week_counter INTEGER;
  current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Se for INSERT ou UPDATE, usar NEW
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Calcular quantas semanas tem o mês (quarta a terça)
    total_weeks := public.get_weeks_in_month(NEW.ano, NEW.mes);
    
    -- Calcular meta semanal base
    weekly_goal := FLOOR(NEW.meta_vendas / total_weeks);
    remaining_goal := NEW.meta_vendas - (weekly_goal * total_weeks);
    
    -- Deletar metas semanais existentes para este vendedor/ano/mes
    DELETE FROM public.metas_semanais_vendedores 
    WHERE vendedor_id = NEW.vendedor_id 
      AND ano = NEW.ano 
      AND semana BETWEEN 1 AND total_weeks;
    
    -- Criar novas metas semanais (quarta 00:00 a terça 23:59)
    FOR week_counter IN 1..total_weeks LOOP
      INSERT INTO public.metas_semanais_vendedores (
        vendedor_id, 
        ano, 
        semana, 
        meta_vendas, 
        created_by
      ) VALUES (
        NEW.vendedor_id,
        NEW.ano,
        week_counter,
        -- Distribuir o resto nas primeiras semanas
        weekly_goal + CASE WHEN week_counter <= remaining_goal THEN 1 ELSE 0 END,
        COALESCE(current_user_id, NEW.created_by)
      );
    END LOOP;
    
    RETURN NEW;
  END IF;
  
  -- Se for DELETE, remover metas semanais correspondentes
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.metas_semanais_vendedores 
    WHERE vendedor_id = OLD.vendedor_id 
      AND ano = OLD.ano;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;