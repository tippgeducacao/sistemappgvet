
-- Garantir que as pontuações para Modalidade do Curso estejam corretas
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Modalidade do Curso';

-- Inserir as pontuações para Modalidade do Curso
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Modalidade do Curso', 'Híbrido (ITH)', 0.2),
('Modalidade do Curso', 'Online (ITH)', 0);
