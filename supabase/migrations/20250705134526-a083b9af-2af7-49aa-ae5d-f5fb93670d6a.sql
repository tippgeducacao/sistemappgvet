
-- Limpar regras existentes
DELETE FROM public.regras_pontuacao;

-- Inserir todas as regras de pontuação conforme especificação

-- 1. LOTE DA PÓS-GRADUAÇÃO
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Lote da Pós-Graduação', 'Lote Integral', 1.0),
('Lote da Pós-Graduação', 'Lote 3', 0.5),
('Lote da Pós-Graduação', 'Lote 2', 0.3),
('Lote da Pós-Graduação', 'Lote 1', 0.0),
('Lote da Pós-Graduação', 'Condições especiais', -0.5);

-- 2. MATRÍCULA
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Matrícula', 'Matrícula integral', 0.2),
('Matrícula', 'Matrícula com cupom 60%', 0.0),
('Matrícula', 'Matrícula com cupom 80%', -0.2),
('Matrícula', 'Matrícula com cupom 100%', -0.5);

-- 3. MODALIDADE DO CURSO
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Modalidade do Curso', 'Híbrido (ITH)', 0.2),
('Modalidade do Curso', 'Online (ITH)', 0.0);

-- 4. CONDIÇÕES DE PARCELAMENTO
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Condições de Parcelamento', 'À vista', 0.3),
('Condições de Parcelamento', '12x', 0.2),
('Condições de Parcelamento', '18x', 0.1),
('Condições de Parcelamento', '24x', 0.0),
('Condições de Parcelamento', '30x', -0.1),
('Condições de Parcelamento', '36x', -0.2);

-- 5. FORMA DE PAGAMENTO
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Forma de Pagamento', 'Cartão de crédito - limite total ou PIX', 0.3),
('Forma de Pagamento', 'Boleto 1x até 30 dias', 0.0),
('Forma de Pagamento', 'Recorrência', 0.0),
('Forma de Pagamento', 'Boleto bancário', -0.3);

-- 6. CANAL/LOCAL DA VENDA (Tipo de Venda)
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Tipo de Venda', 'LIGAÇÃO', 0.3),
('Tipo de Venda', 'LIGAÇÃO E FECHAMENTO NO WHATSAPP', 0.0),
('Tipo de Venda', 'REUNIÃO MEET', 0.0),
('Tipo de Venda', 'VENDA DIRETA', 0.0),
('Tipo de Venda', 'PRESENCIAL', 0.0),
('Tipo de Venda', 'LANÇAMENTO ( CAMPANHA )', 0.0),
('Tipo de Venda', 'EMAIL', 0.0),
('Tipo de Venda', 'OUTRO', 0.0),
('Tipo de Venda', 'WHATSAPP', -0.3);

-- 7. VENDA CASADA
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Venda Casada', 'SIM', 0.3),
('Venda Casada', 'NAO', 0.0);

-- 8. FORMA DE CAPTAÇÃO DO LEAD (todas com 0 pontos)
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Forma de Captação do Lead', 'INDICAÇÃO', 0.0),
('Forma de Captação do Lead', 'ORGÂNICO', 0.0),
('Forma de Captação do Lead', 'GOOGLE', 0.0),
('Forma de Captação do Lead', 'META ADS', 0.0),
('Forma de Captação do Lead', 'LINKEDIN', 0.0);
