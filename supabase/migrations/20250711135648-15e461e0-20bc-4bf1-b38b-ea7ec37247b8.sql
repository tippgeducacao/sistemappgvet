-- Corrigir regras de pontuação com valores decimais
-- Limpar e reinserir com tipos corretos

DELETE FROM public.regras_pontuacao;

-- Alterar tipo da coluna pontos para decimal
ALTER TABLE public.regras_pontuacao ALTER COLUMN pontos TYPE DECIMAL(5,2);

-- Inserir regras corrigidas com valores decimais
-- Regras para Lote da Pós-Graduação
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('lote_pos_graduacao', 'Lote Integral', 1.0),
('lote_pos_graduacao', 'Lote 3', 0.5),
('lote_pos_graduacao', 'Lote 2', 0.3),
('lote_pos_graduacao', 'Lote 1', 0.0),
('lote_pos_graduacao', 'Condições especiais', -0.5);

-- Regras para Tipo de Matrícula
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('tipo_matricula', 'Matrícula integral', 0.2),
('tipo_matricula', 'Matrícula com cupom 60%', 0.0),
('tipo_matricula', 'Matrícula com cupom 80%', -0.2),
('tipo_matricula', 'Matrícula com cupom 100%', -0.5);

-- Regras para Modalidade do Curso
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('modalidade', 'Híbrido (ITH)', 0.2),
('modalidade', 'Online (ITH)', 0.0);

-- Regras para Condições de Parcelamento
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('condicoes_parcelamento', 'À vista', 0.3),
('condicoes_parcelamento', '12x', 0.2),
('condicoes_parcelamento', '18x', 0.1),
('condicoes_parcelamento', '24x', 0.0),
('condicoes_parcelamento', '30x', -0.1),
('condicoes_parcelamento', '36x', -0.2);

-- Regras para Como chegou o lead (Marketing)
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('como_chegou_lead', 'INDICAÇÃO', 0.0),
('como_chegou_lead', 'ORGÂNICO', 0.0),
('como_chegou_lead', 'GOOGLE', 0.0),
('como_chegou_lead', 'META ADS', 0.0),
('como_chegou_lead', 'LINKEDIN', 0.0);

-- Regras para Tipo de Venda
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('tipo_venda', 'REUNIÃO MEET', 0.0),
('tipo_venda', 'LIGAÇÃO', 0.3),
('tipo_venda', 'LIGAÇÃO E FECHAMENTO NO WHATSAPP', 0.0),
('tipo_venda', 'WHATSAPP', -0.3),
('tipo_venda', 'LANÇAMENTO ( CAMPANHA )', 0.0),
('tipo_venda', 'VENDA DIRETA', 0.0),
('tipo_venda', 'PRESENCIAL', 0.0),
('tipo_venda', 'EMAIL', 0.0),
('tipo_venda', 'OUTRO', 0.0);

-- Regras para Venda Casada
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
('venda_casada', 'SIM', 0.3),
('venda_casada', 'NÃO', 0.0);