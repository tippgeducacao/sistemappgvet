-- Atualizar metas semanais dos vendedores junior de 6 para 7
UPDATE metas_semanais_vendedores 
SET meta_vendas = 7, updated_at = now()
WHERE vendedor_id IN (
  SELECT id FROM profiles WHERE nivel = 'junior' AND user_type = 'vendedor'
) AND meta_vendas = 6;