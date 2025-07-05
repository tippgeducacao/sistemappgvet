
-- Garantir que as tabelas estão com as colunas corretas
-- Adicionar coluna vendedor_id na tabela alunos se não existir
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS vendedor_id uuid REFERENCES auth.users(id);

-- Garantir que form_entries tem as colunas necessárias
ALTER TABLE public.form_entries 
ADD COLUMN IF NOT EXISTS aluno_id uuid REFERENCES public.alunos(id),
ADD COLUMN IF NOT EXISTS observacoes text;

-- Criar função para calcular pontuação automaticamente
CREATE OR REPLACE FUNCTION public.calcular_pontuacao_total(entry_id uuid)
RETURNS double precision
LANGUAGE plpgsql
AS $$
DECLARE
  total_pontos double precision := 0;
  resposta RECORD;
BEGIN
  -- Somar pontos das regras definidas no banco
  FOR resposta IN 
    SELECT rf.campo_nome, rf.valor_informado, COALESCE(rp.pontos, 0) as pontos
    FROM public.respostas_formulario rf
    LEFT JOIN public.regras_pontuacao rp ON rf.campo_nome = rp.campo_nome AND rf.valor_informado = rp.opcao_valor
    WHERE rf.form_entry_id = entry_id
  LOOP
    total_pontos := total_pontos + resposta.pontos;
  END LOOP;
  
  -- Adicionar pontos hardcoded para campos específicos
  -- Tipo de Venda
  SELECT rf.valor_informado INTO resposta.valor_informado
  FROM public.respostas_formulario rf
  WHERE rf.form_entry_id = entry_id AND rf.campo_nome = 'Tipo de Venda';
  
  IF resposta.valor_informado = 'LIGAÇÃO' THEN
    total_pontos := total_pontos + 0.3;
  ELSIF resposta.valor_informado = 'WHATSAPP' THEN
    total_pontos := total_pontos - 0.3;
  END IF;
  
  -- Venda Casada
  SELECT rf.valor_informado INTO resposta.valor_informado
  FROM public.respostas_formulario rf
  WHERE rf.form_entry_id = entry_id AND rf.campo_nome = 'Venda Casada';
  
  IF resposta.valor_informado = 'SIM' THEN
    total_pontos := total_pontos + 0.3;
  END IF;
  
  RETURN total_pontos;
END;
$$;

-- Criar trigger para atualizar pontuação automaticamente
CREATE OR REPLACE FUNCTION public.trigger_atualizar_pontuacao()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.form_entries 
  SET pontuacao_esperada = public.calcular_pontuacao_total(NEW.form_entry_id),
      atualizado_em = now()
  WHERE id = NEW.form_entry_id;
  
  RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_calcular_pontuacao ON public.respostas_formulario;
CREATE TRIGGER trigger_calcular_pontuacao
  AFTER INSERT OR UPDATE ON public.respostas_formulario
  FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_pontuacao();
