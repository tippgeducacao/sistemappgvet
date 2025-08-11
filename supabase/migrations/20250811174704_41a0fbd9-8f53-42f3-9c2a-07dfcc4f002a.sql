-- Criar tabelas para histórico mensal das planilhas

-- Tabela para armazenar snapshots mensais das metas e regras
CREATE TABLE public.historico_mensal_planilhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto', -- 'aberto', 'fechado'
  data_fechamento TIMESTAMP WITH TIME ZONE,
  fechado_por UUID,
  snapshot_metas JSONB NOT NULL DEFAULT '{}',
  snapshot_regras_comissionamento JSONB NOT NULL DEFAULT '{}',
  snapshot_niveis JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ano, mes)
);

-- Habilitar RLS
ALTER TABLE public.historico_mensal_planilhas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins e diretores podem gerenciar histórico mensal"
ON public.historico_mensal_planilhas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);

CREATE POLICY "Usuários autenticados podem visualizar histórico mensal"
ON public.historico_mensal_planilhas
FOR SELECT
USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_historico_mensal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_historico_mensal_updated_at
  BEFORE UPDATE ON public.historico_mensal_planilhas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_historico_mensal_updated_at();

-- Função para criar snapshot do mês
CREATE OR REPLACE FUNCTION public.criar_snapshot_mensal(p_ano INTEGER, p_mes INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Função para reabrir mês
CREATE OR REPLACE FUNCTION public.reabrir_mes_planilha(p_ano INTEGER, p_mes INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;