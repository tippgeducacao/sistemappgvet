-- Limpeza das respostas duplicadas na tabela respostas_formulario
-- Manter apenas a resposta mais recente para cada combinação de form_entry_id + campo_nome

WITH duplicates_to_delete AS (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY form_entry_id, campo_nome 
             ORDER BY created_at DESC
           ) as rn
    FROM public.respostas_formulario
  ) ranked
  WHERE rn > 1
)
DELETE FROM public.respostas_formulario 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Criar índice único para prevenir duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_respostas_formulario_unique 
ON public.respostas_formulario (form_entry_id, campo_nome);

-- Função para recalcular pontuação de uma venda específica
CREATE OR REPLACE FUNCTION public.recalculate_venda_score(venda_id uuid)
RETURNS void AS $$
DECLARE
  nova_pontuacao integer := 1; -- pontos base
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalcular pontuações para todas as vendas que podem ter sido afetadas
DO $$
DECLARE
  venda record;
BEGIN
  FOR venda IN 
    SELECT DISTINCT id FROM public.form_entries 
    WHERE pontuacao_esperada IS NOT NULL
  LOOP
    PERFORM public.recalculate_venda_score(venda.id);
  END LOOP;
END $$;