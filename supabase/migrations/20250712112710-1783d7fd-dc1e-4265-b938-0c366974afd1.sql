-- Função para calcular quantas semanas tem um mês específico
CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano INTEGER, mes INTEGER)
RETURNS INTEGER AS $$
DECLARE
  primeiro_dia DATE;
  ultimo_dia DATE;
  semanas INTEGER;
BEGIN
  -- Primeiro dia do mês
  primeiro_dia := DATE(ano || '-' || mes || '-01');
  
  -- Último dia do mês
  ultimo_dia := (primeiro_dia + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calcular número de semanas (considerando semanas completas e parciais)
  -- Uma semana começa na segunda-feira
  semanas := CEIL(EXTRACT(DAY FROM ultimo_dia + EXTRACT(DOW FROM primeiro_dia) * INTERVAL '1 day') / 7.0);
  
  -- Garantir que tenha pelo menos 4 semanas e no máximo 5
  IF semanas < 4 THEN
    semanas := 4;
  ELSIF semanas > 5 THEN
    semanas := 5;
  END IF;
  
  RETURN semanas;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para criar/atualizar metas semanais automaticamente
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
    -- Calcular quantas semanas tem o mês
    total_weeks := public.get_weeks_in_month(NEW.ano, NEW.mes);
    
    -- Calcular meta semanal base
    weekly_goal := FLOOR(NEW.meta_vendas / total_weeks);
    remaining_goal := NEW.meta_vendas - (weekly_goal * total_weeks);
    
    -- Deletar metas semanais existentes para este vendedor/ano/mes
    DELETE FROM public.metas_semanais_vendedores 
    WHERE vendedor_id = NEW.vendedor_id 
      AND ano = NEW.ano 
      AND semana BETWEEN 1 AND total_weeks;
    
    -- Criar novas metas semanais
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

-- Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS trigger_manage_weekly_goals ON public.metas_vendedores;
CREATE TRIGGER trigger_manage_weekly_goals
  AFTER INSERT OR UPDATE OR DELETE ON public.metas_vendedores
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_weekly_goals();