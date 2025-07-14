-- Criar função para recalcular todas as vendas
CREATE OR REPLACE FUNCTION public.recalculate_all_vendas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Criar trigger para recalcular vendas quando regras de pontuação forem alteradas
CREATE OR REPLACE FUNCTION public.trigger_recalculate_vendas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recalcular todas as vendas quando uma regra de pontuação for alterada
  PERFORM public.recalculate_all_vendas();
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para a tabela regras_pontuacao
DROP TRIGGER IF EXISTS recalculate_on_scoring_change ON public.regras_pontuacao;
CREATE TRIGGER recalculate_on_scoring_change
  AFTER INSERT OR UPDATE OR DELETE ON public.regras_pontuacao
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_vendas();