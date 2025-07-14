-- Adicionar políticas RLS para metas semanais
-- Política para vendedores verem suas próprias metas semanais
CREATE POLICY "Vendedores can view their own weekly goals" 
ON public.metas_semanais_vendedores 
FOR SELECT 
USING (vendedor_id = auth.uid());

-- Política para diretores e admins verem todas as metas semanais
CREATE POLICY "Admins can view all weekly goals" 
ON public.metas_semanais_vendedores 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Política para diretores e admins gerenciarem metas semanais
CREATE POLICY "Admins can manage weekly goals" 
ON public.metas_semanais_vendedores 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));