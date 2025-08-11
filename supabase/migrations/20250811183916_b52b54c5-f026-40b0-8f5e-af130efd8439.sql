-- Corrigir os tipos de usuário dos antigos níveis SDR
UPDATE public.niveis_vendedores 
SET tipo_usuario = 'sdr_inbound' 
WHERE nivel IN ('sdr_inbound_junior', 'sdr_inbound_pleno', 'sdr_inbound_senior')
AND tipo_usuario = 'sdr';

UPDATE public.niveis_vendedores 
SET tipo_usuario = 'sdr_outbound' 
WHERE nivel IN ('sdr_outbound_junior', 'sdr_outbound_pleno', 'sdr_outbound_senior')
AND tipo_usuario = 'sdr';