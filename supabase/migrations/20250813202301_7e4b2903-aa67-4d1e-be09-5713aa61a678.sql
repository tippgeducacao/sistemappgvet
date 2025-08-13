-- Deletar o evento especial criado
DELETE FROM public.eventos_especiais 
WHERE titulo = 'Reunião de alinhamento' 
AND is_recorrente = true 
AND tipo_recorrencia = 'semanal';