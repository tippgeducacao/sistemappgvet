-- Ajustar política RLS para permitir que admins, diretores e secretarias também criem grupos
DROP POLICY IF EXISTS "Supervisores podem criar grupos" ON public.grupos_supervisores;

CREATE POLICY "Usuarios autorizados podem criar grupos" 
ON public.grupos_supervisores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('supervisor', 'admin', 'diretor', 'secretaria')
  )
);