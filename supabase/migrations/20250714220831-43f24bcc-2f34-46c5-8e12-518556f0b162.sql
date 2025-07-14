-- Adicionar políticas RLS para metas mensais
-- Política para vendedores verem suas próprias metas mensais
CREATE POLICY "Vendedores can view their own monthly goals" 
ON public.metas_vendedores 
FOR SELECT 
USING (vendedor_id = auth.uid());

-- Política para diretores e admins verem todas as metas mensais
CREATE POLICY "Admins can view all monthly goals" 
ON public.metas_vendedores 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Política para diretores e admins gerenciarem metas mensais
CREATE POLICY "Admins can manage monthly goals" 
ON public.metas_vendedores 
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