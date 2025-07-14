-- Atualizar enum app_role para incluir sdr_inbound e sdr_outbound
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr_inbound';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr_outbound';