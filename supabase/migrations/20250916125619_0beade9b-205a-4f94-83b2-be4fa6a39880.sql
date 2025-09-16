-- Create deterministic vendor selection function (fixed)
CREATE OR REPLACE FUNCTION public.selecionar_vendedor_automatico(
  p_vendedores_ids UUID[],
  p_data_agendamento TIMESTAMP WITH TIME ZONE,
  p_data_fim_agendamento TIMESTAMP WITH TIME ZONE,
  p_pos_graduacao_id UUID DEFAULT NULL
)
RETURNS TABLE(
  vendedor_id UUID,
  vendedor_nome TEXT,
  vendedor_email TEXT,
  agendamentos_ativos INTEGER,
  taxa_conversao DECIMAL(5,2),
  diagnostico JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_vendedor RECORD;
  v_agendamentos_count INTEGER;
  v_taxa_conversao DECIMAL(5,2);
  v_melhor_vendedor RECORD := NULL;
  v_menor_agendamentos INTEGER := 999999;
  v_maior_taxa DECIMAL(5,2) := -1;
  v_diagnostico JSONB := '{}';
  v_vendedores_fora_horario INTEGER := 0;
  v_vendedores_com_conflito INTEGER := 0;
  v_vendedores_disponiveis INTEGER := 0;
  v_horario_valido BOOLEAN;
  v_tem_conflito BOOLEAN;
  v_agendamentos_data JSONB := '[]';
BEGIN
  -- Log de início
  RAISE LOG 'Iniciando seleção automática determinística para % vendedores', array_length(p_vendedores_ids, 1);
  
  -- Processar cada vendedor
  FOR v_vendedor IN 
    SELECT p.id, p.name, p.email, p.horario_trabalho, p.user_type, p.nivel
    FROM public.profiles p
    WHERE p.id = ANY(p_vendedores_ids)
    AND p.ativo = true
    ORDER BY p.name -- Ordem alfabética para determinismo
  LOOP
    -- Contar agendamentos ativos para este vendedor
    SELECT COUNT(*)::INTEGER INTO v_agendamentos_count
    FROM public.agendamentos a
    WHERE a.vendedor_id = v_vendedor.id
    AND a.status IN ('agendado', 'atrasado', 'finalizado', 'finalizado_venda');
    
    -- Calcular taxa de conversão histórica (simplificada)
    WITH reunioes AS (
      SELECT COUNT(*) as total_reunioes
      FROM public.agendamentos a
      WHERE a.vendedor_id = v_vendedor.id
      AND a.resultado_reuniao IN ('presente', 'compareceu', 'realizada')
      AND a.status = 'finalizado'
    ),
    vendas AS (
      SELECT COUNT(*) as total_vendas
      FROM public.form_entries fe
      WHERE fe.vendedor_id = v_vendedor.id
      AND fe.status = 'matriculado'
    )
    SELECT 
      CASE 
        WHEN r.total_reunioes > 0 THEN (v.total_vendas::DECIMAL / r.total_reunioes::DECIMAL * 100)
        ELSE 0 
      END INTO v_taxa_conversao
    FROM reunioes r, vendas v;
    
    v_taxa_conversao := COALESCE(v_taxa_conversao, 0);
    
    -- Adicionar dados do vendedor ao diagnóstico
    v_agendamentos_data := v_agendamentos_data || jsonb_build_object(
      'vendedor_id', v_vendedor.id,
      'nome', v_vendedor.name,
      'agendamentos_count', v_agendamentos_count,
      'taxa_conversao', v_taxa_conversao
    );
    
    -- Log para cada vendedor
    RAISE LOG 'Processando vendedor: % agendamentos, % conversão', v_agendamentos_count, v_taxa_conversao;
    
    -- Verificar horário de trabalho (simulação - sem verificação complexa por enquanto)
    v_horario_valido := true; -- Simplificado para esta versão
    
    IF NOT v_horario_valido THEN
      v_vendedores_fora_horario := v_vendedores_fora_horario + 1;
      CONTINUE;
    END IF;
    
    -- Verificar conflitos com eventos especiais
    SELECT public.verificar_conflito_evento_especial(p_data_agendamento, p_data_fim_agendamento)
    INTO v_tem_conflito;
    
    IF v_tem_conflito THEN
      v_vendedores_com_conflito := v_vendedores_com_conflito + 1;
      CONTINUE;
    END IF;
    
    -- Verificar conflitos de agenda existentes
    SELECT EXISTS(
      SELECT 1 FROM public.agendamentos a
      WHERE a.vendedor_id = v_vendedor.id
      AND a.status IN ('agendado', 'atrasado')
      AND (
        (a.data_agendamento, COALESCE(a.data_fim_agendamento, a.data_agendamento + INTERVAL '1 hour'))
        OVERLAPS
        (p_data_agendamento, p_data_fim_agendamento)
      )
    ) INTO v_tem_conflito;
    
    IF v_tem_conflito THEN
      v_vendedores_com_conflito := v_vendedores_com_conflito + 1;
      CONTINUE;
    END IF;
    
    -- Vendedor está disponível
    v_vendedores_disponiveis := v_vendedores_disponiveis + 1;
    
    -- Aplicar critérios de seleção
    -- 1. Menor número de agendamentos
    IF v_agendamentos_count < v_menor_agendamentos THEN
      v_menor_agendamentos := v_agendamentos_count;
      v_maior_taxa := v_taxa_conversao;
      v_melhor_vendedor := v_vendedor;
      RAISE LOG 'Novo melhor vendedor por agendamentos: %', v_agendamentos_count;
    -- 2. Empate em agendamentos, usar maior taxa de conversão
    ELSIF v_agendamentos_count = v_menor_agendamentos AND v_taxa_conversao > v_maior_taxa THEN
      v_maior_taxa := v_taxa_conversao;
      v_melhor_vendedor := v_vendedor;
      RAISE LOG 'Novo melhor vendedor por conversão: %', v_taxa_conversao;
    -- 3. Empate total, ordem alfabética (já garantida pelo ORDER BY)
    ELSIF v_agendamentos_count = v_menor_agendamentos AND v_taxa_conversao = v_maior_taxa AND v_melhor_vendedor IS NULL THEN
      v_melhor_vendedor := v_vendedor;
      RAISE LOG 'Vendedor selecionado por ordem alfabética';
    END IF;
  END LOOP;
  
  -- Montar diagnóstico
  v_diagnostico := jsonb_build_object(
    'total_vendedores', array_length(p_vendedores_ids, 1),
    'vendedores_fora_horario', v_vendedores_fora_horario,
    'vendedores_com_conflito', v_vendedores_com_conflito,
    'vendedores_disponiveis', v_vendedores_disponiveis,
    'todos_fora_horario', (v_vendedores_fora_horario = array_length(p_vendedores_ids, 1)),
    'todos_com_conflito', (v_vendedores_com_conflito = array_length(p_vendedores_ids, 1)),
    'agendamentos_por_vendedor', v_agendamentos_data,
    'data_agendamento', p_data_agendamento,
    'executado_em', now(),
    'menor_agendamentos_encontrado', v_menor_agendamentos,
    'maior_taxa_encontrada', v_maior_taxa
  );
  
  -- Log final
  IF v_melhor_vendedor IS NOT NULL THEN
    RAISE LOG 'Seleção concluída. Melhor vendedor encontrado';
  ELSE
    RAISE LOG 'Seleção concluída. Nenhum vendedor disponível';
  END IF;
  
  -- Retornar resultado
  IF v_melhor_vendedor IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_melhor_vendedor.id,
      v_melhor_vendedor.name,
      v_melhor_vendedor.email,
      v_menor_agendamentos,
      v_maior_taxa,
      v_diagnostico;
  ELSE
    -- Retornar linha vazia com diagnóstico
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      0::INTEGER,
      0::DECIMAL(5,2),
      v_diagnostico;
  END IF;
END;
$function$;