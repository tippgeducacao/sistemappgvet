
-- Adicionar role de admin para o usuário ppgteste@ppgteste.com
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'admin'::app_role,
    au.id
FROM auth.users au 
WHERE au.email = 'ppgteste@ppgteste.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Também adicionar role de secretaria se necessário
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'secretaria'::app_role,
    au.id
FROM auth.users au 
WHERE au.email = 'ppgteste@ppgteste.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar o perfil para secretaria se existir
UPDATE public.profiles 
SET user_type = 'secretaria'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ppgteste@ppgteste.com'
);
