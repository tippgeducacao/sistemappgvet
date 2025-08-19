-- Adicionar foreign key entre membros_grupos_supervisores e profiles
ALTER TABLE public.membros_grupos_supervisores 
ADD CONSTRAINT fk_membros_grupos_supervisores_usuario 
FOREIGN KEY (usuario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Adicionar foreign key entre membros_grupos_supervisores e grupos_supervisores
ALTER TABLE public.membros_grupos_supervisores 
ADD CONSTRAINT fk_membros_grupos_supervisores_grupo 
FOREIGN KEY (grupo_id) REFERENCES public.grupos_supervisores(id) ON DELETE CASCADE;