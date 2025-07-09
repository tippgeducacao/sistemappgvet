-- Remover a constraint antiga e criar uma nova que inclui 'diretor'
ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_type_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['admin'::text, 'secretaria'::text, 'vendedor'::text, 'diretor'::text]));

-- Agora atualizar o user_type para 'diretor'
UPDATE public.profiles 
SET user_type = 'diretor' 
WHERE email = 'ti@ppg.com';