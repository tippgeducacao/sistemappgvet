-- Atualizar função de recálculo para trabalhar com decimais
CREATE OR REPLACE FUNCTION public.recalculate_venda_score(venda_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
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