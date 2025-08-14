-- Update RLS policy for metas_semanais_vendedores to allow SDRs to create their own weekly goals
DROP POLICY IF EXISTS "Admins can manage weekly goals" ON public.metas_semanais_vendedores;
DROP POLICY IF EXISTS "Admins can view all weekly goals" ON public.metas_semanais_vendedores;
DROP POLICY IF EXISTS "Vendedores can view their own weekly goals" ON public.metas_semanais_vendedores;

-- Create new comprehensive policies
CREATE POLICY "Admins can manage all weekly goals" 
ON public.metas_semanais_vendedores 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);

CREATE POLICY "Users can manage their own weekly goals" 
ON public.metas_semanais_vendedores 
FOR ALL 
USING (vendedor_id = auth.uid())
WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "Users can view all weekly goals" 
ON public.metas_semanais_vendedores 
FOR SELECT 
USING (auth.role() = 'authenticated');