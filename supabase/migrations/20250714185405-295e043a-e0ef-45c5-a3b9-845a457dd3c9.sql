-- Adicionar novos roles para SDR Inbound e Outbound
ALTER TYPE public.app_role ADD VALUE 'sdr_inbound';
ALTER TYPE public.app_role ADD VALUE 'sdr_outbound';