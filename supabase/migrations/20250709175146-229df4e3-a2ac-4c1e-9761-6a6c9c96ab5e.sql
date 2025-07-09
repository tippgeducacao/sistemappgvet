-- Remover a política problemática que acabei de criar
DROP POLICY IF EXISTS "Vendedores can update their own rejected sales" ON public.form_entries;

-- Criar uma política correta que permita vendedores atualizarem suas próprias vendas
CREATE POLICY "Vendedores can update their own sales" 
ON public.form_entries 
FOR UPDATE 
USING (vendedor_id = auth.uid())
WITH CHECK (vendedor_id = auth.uid());