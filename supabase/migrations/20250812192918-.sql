-- Remover níveis junior/pleno/senior para supervisor
DELETE FROM public.niveis_vendedores 
WHERE tipo_usuario = 'supervisor';

-- Adicionar campo bonus_reuniao_b2b na tabela niveis_vendedores
ALTER TABLE public.niveis_vendedores 
ADD COLUMN IF NOT EXISTS bonus_reuniao_b2b numeric DEFAULT 0;

-- Criar configuração única para supervisor
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, meta_semanal_vendedor, meta_vendas_cursos, fixo_mensal, variavel_semanal, vale, bonus_reuniao_b2b)
VALUES 
  ('unico', 'supervisor', 0, 0, 5000, 4000, 400, 50)
ON CONFLICT (nivel, tipo_usuario) DO UPDATE SET
  fixo_mensal = EXCLUDED.fixo_mensal,
  variavel_semanal = EXCLUDED.variavel_semanal,
  vale = EXCLUDED.vale,
  bonus_reuniao_b2b = EXCLUDED.bonus_reuniao_b2b;