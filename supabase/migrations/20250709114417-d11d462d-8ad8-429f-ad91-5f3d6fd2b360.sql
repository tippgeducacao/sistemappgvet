-- Adicionar o role de diretor para o usuário ti@ppg.com quando ele se cadastrar
-- Esta função será executada automaticamente após o usuário se cadastrar

-- Primeiro, vamos verificar se o usuário ti@ppg.com já existe e adicionar o role se necessário
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT p.id, 'diretor'::text, p.id
FROM public.profiles p 
WHERE p.email = 'ti@ppg.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id AND ur.role = 'diretor'
);