-- Inserir regras de comissionamento para SDRs
INSERT INTO public.regras_comissionamento (tipo_usuario, percentual_minimo, percentual_maximo, multiplicador) VALUES
('sdr', 0, 50, 0.0),
('sdr', 51, 70, 0.0),
('sdr', 71, 84, 0.5),
('sdr', 85, 99, 0.7),
('sdr', 100, 119, 1.0),
('sdr', 120, 150, 1.2),
('sdr', 151, 200, 1.8),
('sdr', 201, 999, 2.0)
ON CONFLICT DO NOTHING;