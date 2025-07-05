
-- Limpar completamente as regras de Venda Casada e recriar
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Venda Casada';

-- Inserir as regras corretas para Venda Casada
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) 
VALUES 
  ('Venda Casada', 'SIM', 0.3),
  ('Venda Casada', 'NAO', 0.0);

-- Verificar se as regras foram inseridas
SELECT campo_nome, opcao_valor, pontos FROM public.regras_pontuacao WHERE campo_nome = 'Venda Casada' ORDER BY opcao_valor;
