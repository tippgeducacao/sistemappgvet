-- Criar meta mensal baseada no nível do vendedor
-- Atualizar meta mensal do vendedor (senior = 8 vendas/semana x ~4.3 semanas = ~35 vendas/mês)
UPDATE metas_vendedores 
SET meta_vendas = 35, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025 AND mes = 7;

-- Atualizar todas as metas semanais baseadas no nível senior (8 vendas/semana)
UPDATE metas_semanais_vendedores 
SET meta_vendas = 8, updated_at = now()
WHERE vendedor_id = 'a3e182d3-c4d0-49af-9e95-cac6989820f5' 
AND ano = 2025;