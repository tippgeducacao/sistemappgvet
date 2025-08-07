-- Verificar e corrigir a meta semanal de reuniões para SDR Inbound Junior
-- A meta deve ser 55 reuniões, não 8

UPDATE niveis_vendedores 
SET meta_semanal_inbound = 55
WHERE nivel = 'sdr_inbound_junior' AND tipo_usuario = 'sdr';