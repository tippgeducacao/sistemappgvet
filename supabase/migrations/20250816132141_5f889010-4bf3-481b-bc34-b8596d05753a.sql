-- Atualizar as metas semanais do Carlos para refletir seu nível Pleno (8 pontos)
UPDATE metas_semanais_vendedores 
SET meta_vendas = 8
WHERE vendedor_id = (
  SELECT id FROM profiles WHERE email = 'carlos@ppgvet.com'
) 
AND ano = 2025 
AND semana IN (31, 32, 33, 34, 35);