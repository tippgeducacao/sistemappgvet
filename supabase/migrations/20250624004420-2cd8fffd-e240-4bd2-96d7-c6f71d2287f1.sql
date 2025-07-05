
-- Atualizar regras de pontuação para Canal/Local da Venda
-- Apenas LIGAÇÃO e WHATSAPP devem ter pontuação
UPDATE public.regras_pontuacao 
SET pontos = CASE 
  WHEN opcao_valor = 'LIGAÇÃO' THEN 0.3
  WHEN opcao_valor = 'WHATSAPP' THEN -0.3
  ELSE 0
END
WHERE campo_nome = 'Canal/Local da Venda';
