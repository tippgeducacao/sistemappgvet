-- Primeiro, atualizar o constraint para permitir os novos tipos
ALTER TABLE public.niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_tipo_usuario_check;

-- Adicionar constraint com os novos tipos
ALTER TABLE public.niveis_vendedores 
ADD CONSTRAINT niveis_vendedores_tipo_usuario_check 
CHECK (tipo_usuario IN ('vendedor', 'sdr', 'coordenador', 'supervisor'));

-- Agora inserir os novos níveis
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, meta_semanal_vendedor, meta_vendas_cursos, fixo_mensal, variavel_semanal, vale)
VALUES 
  ('junior', 'coordenador', 0, 0, 3000, 0, 400),
  ('pleno', 'coordenador', 0, 0, 4000, 0, 500),
  ('senior', 'coordenador', 0, 0, 5000, 0, 600),
  ('junior', 'supervisor', 0, 0, 2500, 0, 350),
  ('pleno', 'supervisor', 0, 0, 3500, 0, 450),
  ('senior', 'supervisor', 0, 0, 4500, 0, 550)
ON CONFLICT (nivel, tipo_usuario) DO NOTHING;