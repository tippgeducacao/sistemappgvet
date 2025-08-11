-- Remover os níveis SDR antigos que estão com tipo_usuario incorreto
DELETE FROM public.niveis_vendedores 
WHERE tipo_usuario = 'sdr' 
AND nivel IN ('sdr_inbound_junior', 'sdr_inbound_pleno', 'sdr_inbound_senior', 'sdr_outbound_junior', 'sdr_outbound_pleno', 'sdr_outbound_senior');