
-- Limpar todas as regras de pontuação existentes
DELETE FROM public.regras_pontuacao;

-- Inserir apenas as 6 regras que foram definidas

-- Regra 1: Lote da Pós-Graduação
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Lote da Pós-Graduação', 'Lote Integral', 1),
('Lote da Pós-Graduação', 'Lote 3', 0.5),
('Lote da Pós-Graduação', 'Lote 2', 0.3),
('Lote da Pós-Graduação', 'Lote 1', 0),
('Lote da Pós-Graduação', 'Condições especiais', -0.5);

-- Regra 2: Matrícula
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Matrícula', 'Matrícula integral', 0.2),
('Matrícula', 'Matrícula com cupom 60%', 0),
('Matrícula', 'Matrícula com cupom 80%', -0.2),
('Matrícula', 'Matrícula com cupom 100%', -0.5);

-- Regra 3: Modalidade do Curso
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Modalidade do Curso', 'Online', 0),
('Modalidade do Curso', 'Semipresencial', 0.2);

-- Regra 4: Condições de Parcelamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Condições de Parcelamento', 'À vista', 0.3),
('Condições de Parcelamento', '12x', 0.2),
('Condições de Parcelamento', '18x', 0.1),
('Condições de Parcelamento', '24x', 0),
('Condições de Parcelamento', '30x', -0.1),
('Condições de Parcelamento', '36x', -0.2);

-- Regra 5: Forma de Pagamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Forma de Pagamento', 'Cartão de crédito - limite total ou PIX', 0.3),
('Forma de Pagamento', 'Boleto bancário', -0.3),
('Forma de Pagamento', 'Recorrência', 0),
('Forma de Pagamento', 'Boleto 1x até 30 dias', 0);

-- Regra 6: Canal/Local da Venda
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Canal/Local da Venda', 'Venda via ligação + matrícula', 0.3),
('Canal/Local da Venda', 'Venda via ligação + matrícula depois', 0),
('Canal/Local da Venda', 'Venda somente por WhatsApp', -0.3);
