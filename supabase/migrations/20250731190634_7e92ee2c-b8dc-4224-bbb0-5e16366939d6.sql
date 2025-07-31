-- Criar tabela para avaliacoes semanais de vendedores
CREATE TABLE public.avaliacoes_semanais_vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  semana INTEGER NOT NULL,
  total_reunioes_realizadas INTEGER NOT NULL DEFAULT 0,
  total_matriculas INTEGER NOT NULL DEFAULT 0,
  taxa_conversao DECIMAL(5,2) NOT NULL DEFAULT 0,
  classificacao TEXT NOT NULL DEFAULT 'pendente',
  semanas_consecutivas_abaixo_meta INTEGER NOT NULL DEFAULT 0,
  status_risco TEXT NOT NULL DEFAULT 'normal', -- normal, risco, critico
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(vendedor_id, ano, semana)
);

-- Enable RLS
ALTER TABLE public.avaliacoes_semanais_vendedores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Vendedores podem ver suas próprias avaliações" 
ON public.avaliacoes_semanais_vendedores 
FOR SELECT 
USING (vendedor_id = auth.uid());

CREATE POLICY "Admins e diretores podem gerenciar avaliações" 
ON public.avaliacoes_semanais_vendedores 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Função para calcular avaliacoes semanais
CREATE OR REPLACE FUNCTION public.calcular_avaliacao_semanal_vendedor(
  p_vendedor_id UUID,
  p_ano INTEGER,
  p_semana INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;