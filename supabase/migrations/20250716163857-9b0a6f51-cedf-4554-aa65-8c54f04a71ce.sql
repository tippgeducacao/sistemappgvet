-- Atualizar as metas semanais dos SDRs para corresponder ao que está na interface
-- SDR Inbound
UPDATE public.niveis_vendedores 
SET meta_semanal_inbound = 8 
WHERE nivel = 'sdr_inbound_junior';

UPDATE public.niveis_vendedores 
SET meta_semanal_inbound = 12 
WHERE nivel = 'sdr_inbound_pleno';

UPDATE public.niveis_vendedores 
SET meta_semanal_inbound = 16 
WHERE nivel = 'sdr_inbound_senior';

-- SDR Outbound
UPDATE public.niveis_vendedores 
SET meta_semanal_outbound = 10 
WHERE nivel = 'sdr_outbound_junior';

UPDATE public.niveis_vendedores 
SET meta_semanal_outbound = 14 
WHERE nivel = 'sdr_outbound_pleno';

UPDATE public.niveis_vendedores 
SET meta_semanal_outbound = 18 
WHERE nivel = 'sdr_outbound_senior';