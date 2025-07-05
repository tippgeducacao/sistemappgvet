
-- Limpar regras existentes para Modalidade do Curso (se houver)
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Modalidade do Curso';

-- Inserir as pontuações para Modalidade do Curso baseadas na imagem
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Modalidade do Curso', 'Híbrido (ITH)', 0.2),
('Modalidade do Curso', 'Online (ITH)', 0);
