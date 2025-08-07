-- Atualizar "Lote 3 - LOTE INTEGRAL" para "LOTE 3"
UPDATE regras_pontuacao 
SET opcao_valor = 'LOTE 3'
WHERE campo_nome = 'Lote da Pós-Graduação' 
AND opcao_valor = 'Lote 3 - LOTE INTEGRAL';

-- Criar nova regra para "LOTE INTEGRAL" com 0.3 pontos
INSERT INTO regras_pontuacao (campo_nome, opcao_valor, pontos)
VALUES ('Lote da Pós-Graduação', 'LOTE INTEGRAL', 0.3);