-- Atualizar o user_type do perfil para 'diretor' para o usuário ti@ppg.com
UPDATE public.profiles 
SET user_type = 'diretor' 
WHERE email = 'ti@ppg.com';