-- Atualizar metas do vendedor senior para serem baseadas em PONTOS
-- Senior: 25 pontos/semana x ~4.3 semanas = ~110 pontos/mês

UPDATE metas_vendedores 
SET meta_vendas = 110, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025 AND mes = 7;

-- Atualizar todas as metas semanais para 25 pontos/semana (nível senior)
UPDATE metas_semanais_vendedores 
SET meta_vendas = 25, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025;