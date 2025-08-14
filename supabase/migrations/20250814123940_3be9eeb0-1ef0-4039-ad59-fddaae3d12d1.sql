-- Fix remaining database functions with search_path protection
-- Complete the security hardening by protecting all remaining functions

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'vendedor')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_document_by_venda_id(venda_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  document_path TEXT;
BEGIN
  SELECT documento_comprobatorio INTO document_path
  FROM public.form_entries
  WHERE id = venda_id_param;
  
  RETURN document_path;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_document_in_bucket(search_pattern text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  document_path TEXT;
BEGIN
  SELECT name INTO document_path
  FROM storage.objects
  WHERE bucket_id = 'documentos-vendas'
  AND name LIKE '%' || search_pattern || '%'
  LIMIT 1;
  
  RETURN document_path;
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_bucket_files(bucket_name text, folder_prefix text DEFAULT ''::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata
  FROM storage.objects o
  WHERE o.bucket_id = bucket_name
  AND (folder_prefix = '' OR o.name LIKE folder_prefix || '%');
END;
$function$;

CREATE OR REPLACE FUNCTION public.verificar_conflito_evento_especial(data_inicio_agendamento timestamp with time zone, data_fim_agendamento timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.eventos_especiais
    WHERE (
      (data_inicio_agendamento >= data_inicio AND data_inicio_agendamento < data_fim) OR
      (data_fim_agendamento > data_inicio AND data_fim_agendamento <= data_fim) OR
      (data_inicio_agendamento <= data_inicio AND data_fim_agendamento >= data_fim)
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_overdue_appointments()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Atualizar agendamentos que passaram do horário para status 'atrasado'
  UPDATE agendamentos 
  SET status = 'atrasado'
  WHERE status = 'agendado' 
  AND (
    (data_fim_agendamento IS NOT NULL AND data_fim_agendamento < now()) 
    OR 
    (data_fim_agendamento IS NULL AND data_agendamento + INTERVAL '1 hour' < now())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_update_overdue_appointments()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Atualizar agendamentos que passaram do horário para status 'atrasado'
  -- quando o vendedor não lançou o resultado
  UPDATE agendamentos 
  SET status = 'atrasado'
  WHERE status = 'agendado' 
  AND resultado_reuniao IS NULL  -- Vendedor não lançou resultado
  AND (
    (data_fim_agendamento IS NOT NULL AND data_fim_agendamento < now()) 
    OR 
    (data_fim_agendamento IS NULL AND data_agendamento + INTERVAL '1 hour' < now())
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calcular_avaliacao_semanal_vendedor(p_vendedor_id uuid, p_ano integer, p_semana integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  reunioes_realizadas INTEGER := 0;
  matriculas_realizadas INTEGER := 0;
  taxa_conversao_calculada DECIMAL(5,2) := 0;
  classificacao_resultado TEXT := 'pendente';
  semanas_consecutivas INTEGER := 0;
  status_risco_calculado TEXT := 'normal';
  data_inicio_semana DATE;
  data_fim_semana DATE;
BEGIN
  -- Calcular datas da semana (quarta a terça)
  data_inicio_semana := DATE(p_ano || '-01-01') + (p_semana - 1) * INTERVAL '7 days';
  
  -- Ajustar para começar na quarta-feira
  WHILE EXTRACT(DOW FROM data_inicio_semana) != 3 LOOP -- 3 = quarta-feira
    data_inicio_semana := data_inicio_semana + INTERVAL '1 day';
  END LOOP;
  
  data_fim_semana := data_inicio_semana + INTERVAL '6 days';
  
  -- Contar reuniões realizadas (com presença)
  SELECT COUNT(*)
  INTO reunioes_realizadas
  FROM agendamentos a
  WHERE a.vendedor_id = p_vendedor_id
    AND a.data_agendamento BETWEEN data_inicio_semana AND data_fim_semana + INTERVAL '23:59:59'
    AND a.resultado_reuniao IN ('presente', 'compareceu', 'realizada')
    AND a.status = 'finalizado';
  
  -- Contar matrículas da semana
  SELECT COUNT(*)
  INTO matriculas_realizadas
  FROM form_entries fe
  WHERE fe.vendedor_id = p_vendedor_id
    AND fe.status = 'matriculado'
    AND fe.data_aprovacao BETWEEN data_inicio_semana AND data_fim_semana + INTERVAL '23:59:59';
  
  -- Calcular taxa de conversão
  IF reunioes_realizadas > 0 THEN
    taxa_conversao_calculada := (matriculas_realizadas::DECIMAL / reunioes_realizadas::DECIMAL) * 100;
  ELSE
    taxa_conversao_calculada := 0;
  END IF;
  
  -- Determinar classificação
  IF taxa_conversao_calculada >= 30 THEN
    classificacao_resultado := 'excelente';
    status_risco_calculado := 'normal';
  ELSE
    classificacao_resultado := 'recuperacao';
    
    -- Calcular semanas consecutivas abaixo da meta
    SELECT COALESCE(MAX(semanas_consecutivas_abaixo_meta), 0) + 1
    INTO semanas_consecutivas
    FROM avaliacoes_semanais_vendedores
    WHERE vendedor_id = p_vendedor_id
      AND classificacao = 'recuperacao'
      AND ano = p_ano
      AND semana < p_semana
    ORDER BY ano DESC, semana DESC
    LIMIT 1;
    
    -- Determinar status de risco
    IF semanas_consecutivas >= 4 THEN
      status_risco_calculado := 'critico';
    ELSIF semanas_consecutivas >= 2 THEN
      status_risco_calculado := 'risco';
    ELSE
      status_risco_calculado := 'normal';
    END IF;
  END IF;
  
  -- Inserir ou atualizar avaliação
  INSERT INTO public.avaliacoes_semanais_vendedores (
    vendedor_id,
    ano,
    semana,
    total_reunioes_realizadas,
    total_matriculas,
    taxa_conversao,
    classificacao,
    semanas_consecutivas_abaixo_meta,
    status_risco,
    created_by
  ) VALUES (
    p_vendedor_id,
    p_ano,
    p_semana,
    reunioes_realizadas,
    matriculas_realizadas,
    taxa_conversao_calculada,
    classificacao_resultado,
    semanas_consecutivas,
    status_risco_calculado,
    auth.uid()
  )
  ON CONFLICT (vendedor_id, ano, semana)
  DO UPDATE SET
    total_reunioes_realizadas = EXCLUDED.total_reunioes_realizadas,
    total_matriculas = EXCLUDED.total_matriculas,
    taxa_conversao = EXCLUDED.taxa_conversao,
    classificacao = EXCLUDED.classificacao,
    semanas_consecutivas_abaixo_meta = EXCLUDED.semanas_consecutivas_abaixo_meta,
    status_risco = EXCLUDED.status_risco,
    updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_monthly_weekly_goals(p_ano integer, p_mes integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_venda_score(venda_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  nova_pontuacao DECIMAL(5,2) := 1.0; -- pontos base
  resposta record;
  regra record;
BEGIN
  -- Buscar respostas da venda
  FOR resposta IN 
    SELECT campo_nome, valor_informado 
    FROM public.respostas_formulario 
    WHERE form_entry_id = venda_id
  LOOP
    -- Buscar regra correspondente
    SELECT pontos INTO regra
    FROM public.regras_pontuacao 
    WHERE campo_nome = resposta.campo_nome 
    AND opcao_valor = resposta.valor_informado;
    
    -- Somar pontos se regra encontrada
    IF FOUND THEN
      nova_pontuacao := nova_pontuacao + regra.pontos;
    END IF;
  END LOOP;
  
  -- Atualizar pontuação na venda
  UPDATE public.form_entries 
  SET pontuacao_esperada = nova_pontuacao,
      atualizado_em = now()
  WHERE id = venda_id;
END;
$function$;