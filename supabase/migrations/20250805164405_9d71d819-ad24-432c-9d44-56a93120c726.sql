-- Ativar a conta de administrador
UPDATE public.profiles 
SET ativo = true 
WHERE email = 'admin@ppgvet.com';

-- Verificar se foi ativado
SELECT id, name, email, user_type, ativo 
FROM public.profiles 
WHERE email = 'admin@ppgvet.com';