
-- Limpar regras existentes para Canal/Local da Venda
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Canal/Local da Venda';

-- Inserir as novas regras de pontuação para Canal/Local da Venda com os valores corretos do formulário
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Canal/Local da Venda', 'REUNIÃO MEET', 0.2),
('Canal/Local da Venda', 'LIGAÇÃO', 0.3),
('Canal/Local da Venda', 'WHATSAPP', -0.1),
('Canal/Local da Venda', 'LANÇAMENTO ( CAMPANHA )', 0.1),
('Canal/Local da Venda', 'VENDA DIRETA', 0.4),
('Canal/Local da Venda', 'PRESENCIAL', 0.5),
('Canal/Local da Venda', 'EMAIL', -0.2),
('Canal/Local da Venda', 'OUTRO', 0);
