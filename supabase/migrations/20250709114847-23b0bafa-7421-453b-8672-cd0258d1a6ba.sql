-- Adicionar o role 'diretor' para o usuário ti@ppg.com
INSERT INTO public.user_roles (user_id, role, created_by)
VALUES (
  '047ad3dc-c98e-492c-98b7-f7b003d58902', 
  'diretor'::app_role, 
  '047ad3dc-c98e-492c-98b7-f7b003d58902'
)
ON CONFLICT (user_id, role) DO NOTHING;