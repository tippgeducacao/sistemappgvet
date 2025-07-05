
-- Primeiro, vamos limpar as regras existentes para o campo "Canal/Local da Venda" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Canal/Local da Venda';

-- Inserir as novas regras de pontuação para Canal/Local da Venda
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Canal/Local da Venda', 'Venda via ligação + matrícula', 0.3),
('Canal/Local da Venda', 'Venda via ligação + matrícula depois', 0),
('Canal/Local da Venda', 'Venda somente por WhatsApp', -0.3);
