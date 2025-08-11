-- Primeiro, verificar o constraint atual e adicionar 'sdr' aos valores permitidos
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Adicionar novo constraint que inclui 'sdr'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('admin', 'secretaria', 'vendedor', 'diretor', 'sdr_inbound', 'sdr_outbound', 'sdr'));

-- Agora migrar os usuários
UPDATE public.profiles 
SET 
  user_type = 'sdr',
  nivel = 'junior'
WHERE user_type IN ('sdr_inbound', 'sdr_outbound');