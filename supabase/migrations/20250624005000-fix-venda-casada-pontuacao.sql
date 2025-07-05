
-- Verificar se existem regras para Venda Casada e criar se necessário
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) 
VALUES 
  ('Venda Casada', 'SIM', 0.3),
  ('Venda Casada', 'NAO', 0)
ON CONFLICT (campo_nome, opcao_valor) DO UPDATE SET pontos = EXCLUDED.pontos;
