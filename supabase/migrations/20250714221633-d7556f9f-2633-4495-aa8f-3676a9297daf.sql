-- Reverter para os valores originais dos níveis
-- Junior: 6 pontos/semana (valor original)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 6
WHERE nivel = 'junior' AND tipo_usuario = 'vendedor';

-- Pleno: 7 pontos/semana (valor original)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 7
WHERE nivel = 'pleno' AND tipo_usuario = 'vendedor';

-- Senior: 8 pontos/semana (valor original)
UPDATE niveis_vendedores 
SET meta_semanal_vendedor = 8
WHERE nivel = 'senior' AND tipo_usuario = 'vendedor';