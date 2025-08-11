-- Remover o constraint único em 'nivel' e criar um novo constraint composto
ALTER TABLE public.niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_nivel_key;

-- Criar constraint único composto (nivel + tipo_usuario)
ALTER TABLE public.niveis_vendedores ADD CONSTRAINT niveis_vendedores_nivel_tipo_key UNIQUE (nivel, tipo_usuario);

-- Agora inserir os níveis SDR
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
  ('senior', 'sdr', 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (nivel, tipo_usuario) DO NOTHING;