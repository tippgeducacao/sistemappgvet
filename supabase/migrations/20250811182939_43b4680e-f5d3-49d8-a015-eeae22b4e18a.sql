-- Criar níveis SDR com configurações zeradas para edição posterior
INSERT INTO public.niveis_vendedores (
  nivel,
  tipo_usuario,
  fixo_mensal,
  vale,
  variavel_semanal,
  meta_semanal_vendedor,
  meta_semanal_inbound,
  meta_semanal_outbound,
  meta_vendas_cursos
) VALUES
  ('junior', 'sdr', 0, 0, 0, 0, 0, 0, 0),
  ('pleno', 'sdr', 0, 0, 0, 0, 0, 0, 0),
  ('senior', 'sdr', 0, 0, 0, 0, 0, 0, 0);