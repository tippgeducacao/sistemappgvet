-- Atualizar função criar_snapshot_mensal para incluir snapshot dos membros dos grupos
CREATE OR REPLACE FUNCTION public.criar_snapshot_mensal(p_ano integer, p_mes integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  snapshot_metas JSONB;
  snapshot_regras JSONB;
  snapshot_niveis JSONB;
  snapshot_membros JSONB;
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

  -- Criar snapshot dos membros dos grupos (organizados por grupo_id)
  SELECT jsonb_object_agg(
    grupo_id::text,
    grupo_membros
  ) INTO snapshot_membros
  FROM (
    SELECT 
      gs.id as grupo_id,
      jsonb_agg(
        jsonb_build_object(
          'usuario_id', mgs.usuario_id,
          'nome', p.name,
          'user_type', p.user_type,
          'nivel', p.nivel,
          'ativo', p.ativo,
          'created_at', mgs.created_at,
          'left_at', mgs.left_at
        )
      ) as grupo_membros
    FROM public.grupos_supervisores gs
    LEFT JOIN public.membros_grupos_supervisores mgs ON mgs.grupo_id = gs.id
    LEFT JOIN public.profiles p ON p.id = mgs.usuario_id
    WHERE mgs.usuario_id IS NOT NULL -- Só incluir grupos que tem membros
    GROUP BY gs.id
  ) grupos_com_membros;

  -- Inserir ou atualizar o histórico
  INSERT INTO public.historico_mensal_planilhas (
    ano,
    mes,
    status,
    data_fechamento,
    fechado_por,
    snapshot_metas,
    snapshot_regras_comissionamento,
    snapshot_niveis,
    snapshot_membros
  ) VALUES (
    p_ano,
    p_mes,
    'fechado',
    now(),
    auth.uid(),
    COALESCE(snapshot_metas, '[]'::jsonb),
    COALESCE(snapshot_regras, '[]'::jsonb),
    COALESCE(snapshot_niveis, '[]'::jsonb),
    COALESCE(snapshot_membros, '{}'::jsonb)
  )
  ON CONFLICT (ano, mes)
  DO UPDATE SET
    status = 'fechado',
    data_fechamento = now(),
    fechado_por = auth.uid(),
    snapshot_metas = COALESCE(snapshot_metas, '[]'::jsonb),
    snapshot_regras_comissionamento = COALESCE(snapshot_regras, '[]'::jsonb),
    snapshot_niveis = COALESCE(snapshot_niveis, '[]'::jsonb),
    snapshot_membros = COALESCE(snapshot_membros, '{}'::jsonb),
    updated_at = now();

  RETURN TRUE;
END;
$function$;