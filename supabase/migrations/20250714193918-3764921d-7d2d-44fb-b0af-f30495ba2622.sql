-- Remover constraint antiga que não inclui sdr_inbound e sdr_outbound
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Criar nova constraint que inclui todos os tipos de usuário
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['admin'::text, 'secretaria'::text, 'vendedor'::text, 'diretor'::text, 'sdr_inbound'::text, 'sdr_outbound'::text]));