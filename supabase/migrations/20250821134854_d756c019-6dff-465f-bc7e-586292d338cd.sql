-- Inserir regras de comissionamento para supervisores
INSERT INTO public.regras_comissionamento (
  tipo_usuario, 
  percentual_minimo, 
  percentual_maximo, 
  multiplicador
) VALUES 
-- Faixas de comissionamento para supervisores baseado na média da equipe
('supervisor', 0, 49.99, 0),      -- 0-49.9%: sem comissão
('supervisor', 50, 69.99, 0.5),   -- 50-69.9%: multiplicador 0.5x
('supervisor', 70, 79.99, 0.75),  -- 70-79.9%: multiplicador 0.75x
('supervisor', 80, 89.99, 1.0),   -- 80-89.9%: multiplicador 1.0x
('supervisor', 90, 99.99, 1.25),  -- 90-99.9%: multiplicador 1.25x
('supervisor', 100, 999, 1.5);    -- 100%+: multiplicador 1.5x