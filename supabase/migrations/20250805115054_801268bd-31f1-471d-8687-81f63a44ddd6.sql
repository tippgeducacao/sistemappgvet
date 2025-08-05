-- Atualizar a constraint de check para incluir os novos níveis SDR
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nivel_check;

-- Criar nova constraint que inclui todos os níveis possíveis
ALTER TABLE public.profiles ADD CONSTRAINT profiles_nivel_check 
CHECK (nivel IN (
  'junior', 
  'pleno', 
  'senior',
  'sdr_inbound_junior',
  'sdr_inbound_pleno', 
  'sdr_inbound_senior',
  'sdr_outbound_junior',
  'sdr_outbound_pleno',
  'sdr_outbound_senior'
));