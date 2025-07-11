-- Inserir regras de pontuação para Forma de Pagamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Forma de Pagamento', 'Cartão de crédito - limite total ou PIX', 0.3),
('Forma de Pagamento', 'Boleto bancário', -0.3),
('Forma de Pagamento', 'Recorrência', 0.0),
('Forma de Pagamento', 'Boleto 1x até 30 dias', 0.0);