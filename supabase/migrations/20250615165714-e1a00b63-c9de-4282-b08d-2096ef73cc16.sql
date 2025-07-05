
-- Primeiro, vamos limpar as regras existentes para o campo "Modalidade do Curso" se houver
DELETE FROM public.regras_pontuacao WHERE campo_nome = 'Modalidade do Curso';

-- Inserir as novas regras de pontuação para Modalidade do Curso
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('Modalidade do Curso', 'Online', 0),
('Modalidade do Curso', 'Semipresencial', 0.2);
