-- Primeiro vamos ver quais constraints existem e ajustar
-- Vamos usar os valores existentes de nível mas com tipo_usuario = 'sdr'
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
) 
SELECT 
  'junior'::text,
  'sdr'::text,
  0::numeric,
  0::numeric,
  0::numeric,
  0::integer,
  0::integer,
  0::integer,
  0::integer
WHERE NOT EXISTS (
  SELECT 1 FROM public.niveis_vendedores 
  WHERE tipo_usuario = 'sdr' AND nivel = 'junior'
)
UNION ALL
SELECT 
  'pleno'::text,
  'sdr'::text,
  0::numeric,
  0::numeric,
  0::numeric,
  0::integer,
  0::integer,
  0::integer,
  0::integer
WHERE NOT EXISTS (
  SELECT 1 FROM public.niveis_vendedores 
  WHERE tipo_usuario = 'sdr' AND nivel = 'pleno'
)
UNION ALL
SELECT 
  'senior'::text,
  'sdr'::text,
  0::numeric,
  0::numeric,
  0::numeric,
  0::integer,
  0::integer,
  0::integer,
  0::integer
WHERE NOT EXISTS (
  SELECT 1 FROM public.niveis_vendedores 
  WHERE tipo_usuario = 'sdr' AND nivel = 'senior'
);