-- Fix the remaining database functions with search_path protection
-- Final batch to secure all remaining functions

CREATE OR REPLACE FUNCTION public.manage_weekly_goals()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_all_vendas()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  venda_record RECORD;
BEGIN
  -- Para cada venda existente, recalcular a pontuação
  FOR venda_record IN 
    SELECT id FROM public.form_entries
  LOOP
    PERFORM public.recalculate_venda_score(venda_record.id);
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_vendas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Recalcular todas as vendas quando uma regra de pontuação for alterada
  PERFORM public.recalculate_all_vendas();
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.clean_invalid_pos_graduacoes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  vendor_record RECORD;
  valid_groups uuid[];
BEGIN
  -- Para cada vendedor com grupos
  FOR vendor_record IN 
    SELECT id, pos_graduacoes 
    FROM public.profiles 
    WHERE pos_graduacoes IS NOT NULL AND array_length(pos_graduacoes, 1) > 0
  LOOP
    -- Filtrar apenas grupos que existem e estão ativos
    SELECT array_agg(g.id) INTO valid_groups
    FROM unnest(vendor_record.pos_graduacoes) AS pg(id)
    JOIN public.grupos_pos_graduacoes g ON g.id = pg.id AND g.ativo = true;
    
    -- Atualizar o vendedor com apenas grupos válidos
    UPDATE public.profiles 
    SET pos_graduacoes = COALESCE(valid_groups, ARRAY[]::uuid[])
    WHERE id = vendor_record.id;
  END LOOP;
  
  RAISE NOTICE 'Grupos inválidos removidos dos vendedores';
END;
$function$;

CREATE OR REPLACE FUNCTION public.criar_snapshot_mensal(p_ano integer, p_mes integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  snapshot_metas JSONB;
  snapshot_regras JSONB;
  snapshot_niveis JSONB;
BEGIN
  -- Verificar permissão
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  ) THEN
    RETURN FALSE;
  END IF;

  -- Criar snapshot das metas semanais
  SELECT jsonb_agg(
    jsonb_build_object(
      'vendedor_id', vendedor_id,
      'ano', ano,
      'semana', semana,
      'meta_vendas', meta_vendas,
      'created_at', created_at
    )
  ) INTO snapshot_metas
  FROM public.metas_semanais_vendedores
  WHERE ano = p_ano;

  -- Criar snapshot das regras de comissionamento
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'tipo_usuario', tipo_usuario,
      'percentual_minimo', percentual_minimo,
      'percentual_maximo', percentual_maximo,
      'multiplicador', multiplicador
    )
  ) INTO snapshot_regras
  FROM public.regras_comissionamento;

  -- Criar snapshot dos níveis
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'nivel', nivel,
      'tipo_usuario', tipo_usuario,
      'meta_semanal_vendedor', meta_semanal_vendedor,
      'meta_semanal_inbound', meta_semanal_inbound,
      'meta_semanal_outbound', meta_semanal_outbound,
      'variavel_semanal', variavel_semanal,
      'fixo_mensal', fixo_mensal,
      'vale', vale
    )
  ) INTO snapshot_niveis
  FROM public.niveis_vendedores;

  -- Inserir ou atualizar o histórico
  INSERT INTO public.historico_mensal_planilhas (
    ano,
    mes,
    status,
    data_fechamento,
    fechado_por,
    snapshot_metas,
    snapshot_regras_comissionamento,
    snapshot_niveis
  ) VALUES (
    p_ano,
    p_mes,
    'fechado',
    now(),
    auth.uid(),
    COALESCE(snapshot_metas, '[]'::jsonb),
    COALESCE(snapshot_regras, '[]'::jsonb),
    COALESCE(snapshot_niveis, '[]'::jsonb)
  )
  ON CONFLICT (ano, mes)
  DO UPDATE SET
    status = 'fechado',
    data_fechamento = now(),
    fechado_por = auth.uid(),
    snapshot_metas = COALESCE(snapshot_metas, '[]'::jsonb),
    snapshot_regras_comissionamento = COALESCE(snapshot_regras, '[]'::jsonb),
    snapshot_niveis = COALESCE(snapshot_niveis, '[]'::jsonb),
    updated_at = now();

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reabrir_mes_planilha(p_ano integer, p_mes integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Verificar permissão (apenas diretores podem reabrir)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.historico_mensal_planilhas
  SET 
    status = 'aberto',
    data_fechamento = NULL,
    updated_at = now()
  WHERE ano = p_ano AND mes = p_mes;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_weekly_goals_for_vendor(p_vendedor_id uuid, p_ano integer, p_mes integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  vendor_level TEXT;
  weekly_goal INTEGER;
  week_counter INTEGER;
  primeira_terca DATE;
  current_tuesday DATE;
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
  
  -- Deletar TODAS as metas semanais existentes para este vendedor/ano
  DELETE FROM public.metas_semanais_vendedores 
  WHERE vendedor_id = p_vendedor_id 
    AND ano = p_ano;
  
  -- Encontrar a primeira terça-feira do mês
  primeira_terca := DATE(p_ano || '-' || p_mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça é muito tarde no mês, verificar a anterior
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    primeira_terca := primeira_terca - INTERVAL '7 days';
  END IF;
  
  -- Criar metas para TODAS as semanas que terminam no mês
  current_tuesday := primeira_terca;
  week_counter := 1;
  
  WHILE EXTRACT(MONTH FROM current_tuesday) = p_mes AND EXTRACT(YEAR FROM current_tuesday) = p_ano LOOP
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
    current_tuesday := current_tuesday + INTERVAL '7 days';
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_weeks_in_month(ano integer, mes integer)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path = ''
AS $function$
DECLARE
  primeira_terca DATE;
  current_tuesday DATE;
  week_count INTEGER := 0;
BEGIN
  -- Encontrar a primeira terça-feira do mês
  primeira_terca := DATE(ano || '-' || mes || '-01');
  WHILE EXTRACT(DOW FROM primeira_terca) != 2 LOOP -- 2 = terça-feira
    primeira_terca := primeira_terca + INTERVAL '1 day';
  END LOOP;
  
  -- Se a primeira terça-feira é muito tarde no mês (depois do dia 7),
  -- verificar se existe uma semana anterior que termina neste mês
  IF EXTRACT(DAY FROM primeira_terca) > 7 THEN
    primeira_terca := primeira_terca - INTERVAL '7 days';
  END IF;
  
  -- Contar TODAS as terças-feiras que estão no mês especificado
  current_tuesday := primeira_terca;
  WHILE EXTRACT(MONTH FROM current_tuesday) = mes AND EXTRACT(YEAR FROM current_tuesday) = ano LOOP
    week_count := week_count + 1;
    current_tuesday := current_tuesday + INTERVAL '7 days';
  END LOOP;
  
  RETURN week_count;
END;
$function$;

-- Fix all remaining trigger functions with search_path
CREATE OR REPLACE FUNCTION public.update_regras_comissionamento_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_metas_vendedores_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_metas_semanais_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_niveis_vendedores_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_agendamentos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_grupos_pos_graduacoes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_historico_mensal_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_relatorios_diarios_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_eventos_especiais_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;