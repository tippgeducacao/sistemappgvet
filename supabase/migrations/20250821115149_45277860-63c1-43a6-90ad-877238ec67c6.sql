-- Corrigir política problemática que causa recursão infinita
-- A política "Secretarias can update vendor profiles" está consultando a própria tabela profiles

-- Remover a política problemática
DROP POLICY IF EXISTS "Secretarias can update vendor profiles" ON public.profiles;

-- Recriar a política usando a função security definer
CREATE POLICY "Secretarias can update vendor profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_management_user())
WITH CHECK (public.is_management_user());