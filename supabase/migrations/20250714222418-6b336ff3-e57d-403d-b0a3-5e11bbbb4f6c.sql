-- Remover regras de pontuação para Canal/Local da Venda
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Canal/Local da Venda';

-- Remover opção "Lote integral" do Lote da Pós-Graduação
DELETE FROM public.regras_pontuacao 
WHERE campo_nome = 'Lote da Pós-Graduação' AND opcao_valor = 'Lote integral';

-- Renomear "Lote 3" para "Lote 3 - LOTE INTEGRAL"
UPDATE public.regras_pontuacao 
SET opcao_valor = 'Lote 3 - LOTE INTEGRAL'
WHERE campo_nome = 'Lote da Pós-Graduação' AND opcao_valor = 'Lote 3';