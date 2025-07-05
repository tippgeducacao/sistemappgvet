
-- Primeiro, vamos limpar as regras existentes para o campo "Lote da Pós-Graduação" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Lote da Pós-Graduação';

-- Inserir as novas regras de pontuação para Lote da Pós-Graduação
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Lote da Pós-Graduação', 'Lote Integral', 1),
('Lote da Pós-Graduação', 'Lote 3', 0.5),
('Lote da Pós-Graduação', 'Lote 2', 0.3),
('Lote da Pós-Graduação', 'Lote 1', 0),
('Lote da Pós-Graduação', 'Condições especiais', -0.5);
