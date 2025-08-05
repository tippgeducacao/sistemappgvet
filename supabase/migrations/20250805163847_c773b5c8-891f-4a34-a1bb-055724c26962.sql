-- Limpar todos os grupos de pós-graduações dos vendedores
UPDATE public.profiles 
SET pos_graduacoes = ARRAY[]::uuid[]
WHERE pos_graduacoes IS NOT NULL;

-- Verificar a estrutura atual
SELECT 
  id, 
  name, 
  user_type, 
  array_length(pos_graduacoes, 1) as total_pos_graduacoes
FROM public.profiles 
WHERE user_type IN ('vendedor', 'sdr_inbound', 'sdr_outbound') 
  AND pos_graduacoes IS NOT NULL 
  AND array_length(pos_graduacoes, 1) > 0;