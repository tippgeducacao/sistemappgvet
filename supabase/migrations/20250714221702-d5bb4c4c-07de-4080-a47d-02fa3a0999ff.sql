-- Ajustar metas do vendedor senior para usar valores corretos
-- Senior: 8 pontos/semana x ~4.3 semanas = ~35 pontos/mês

UPDATE metas_vendedores 
SET meta_vendas = 35, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025 AND mes = 7;

-- Atualizar metas semanais para 8 pontos/semana (valor original do nível senior)
UPDATE metas_semanais_vendedores 
SET meta_vendas = 8, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025;