
-- Primeiro, vamos limpar as regras existentes para o campo "Matrícula" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Matrícula';

-- Inserir as novas regras de pontuação para Matrícula
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Matrícula', 'Matrícula integral', 0.2),
('Matrícula', 'Matrícula com cupom 60%', 0),
('Matrícula', 'Matrícula com cupom 80%', -0.2),
('Matrícula', 'Matrícula com cupom 100%', -0.5);
