-- Adicionar políticas RLS de SELECT para a tabela form_entries
-- para que os usuários possam visualizar as vendas

-- Política para vendedores verem suas próprias vendas
CREATE POLICY "Vendedores can view their own sales" 
ON public.form_entries 
FOR SELECT 
USING (vendedor_id = auth.uid());

-- Política para secretárias verem todas as vendas
CREATE POLICY "Secretarias can view all sales" 
ON public.form_entries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('secretaria', 'admin')
));

-- Política para diretores verem todas as vendas
CREATE POLICY "Diretores can view all sales" 
ON public.form_entries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type = 'diretor'
));