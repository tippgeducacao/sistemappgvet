
-- Primeiro, vamos limpar as regras existentes para o campo "Condições de Parcelamento" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Condições de Parcelamento';

-- Inserir as novas regras de pontuação para Condições de Parcelamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Condições de Parcelamento', 'À vista', 0.3),
('Condições de Parcelamento', '12x', 0.2),
('Condições de Parcelamento', '18x', 0.1),
('Condições de Parcelamento', '24x', 0),
('Condições de Parcelamento', '30x', -0.1),
('Condições de Parcelamento', '36x', -0.2);
