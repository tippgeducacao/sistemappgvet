
-- Primeiro, vamos limpar as regras existentes para o campo "Forma de Pagamento" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Forma de Pagamento';

-- Inserir as novas regras de pontuação para Forma de Pagamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Forma de Pagamento', 'Cartão de crédito - limite total ou PIX', 0.3),
('Forma de Pagamento', 'Boleto bancário', -0.3),
('Forma de Pagamento', 'Recorrência', 0),
('Forma de Pagamento', 'Boleto 1x até 30 dias', 0);
