-- Remover metas personalizadas incorretas para o SDR Júlio
DELETE FROM public.metas_semanais_vendedores 
WHERE vendedor_id = '49c58953-e02d-4331-b2a5-a66e4f46240d'
  AND ano = 2025
  AND meta_vendas = 6;