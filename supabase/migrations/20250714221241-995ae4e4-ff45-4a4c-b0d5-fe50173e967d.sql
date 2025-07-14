-- Corrigir configurações dos níveis para serem baseadas em PONTOS por semana
-- Considerando que cada venda gera em média 2-3 pontos:

-- Junior: ~15 pontos/semana (equivale a ~5-7 vendas)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 15
WHERE nivel = 'junior' AND tipo_usuario = 'vendedor';

-- Pleno: ~20 pontos/semana (equivale a ~7-10 vendas)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 20
WHERE nivel = 'pleno' AND tipo_usuario = 'vendedor';

-- Senior: ~25 pontos/semana (equivale a ~8-12 vendas)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 25
WHERE nivel = 'senior' AND tipo_usuario = 'vendedor';