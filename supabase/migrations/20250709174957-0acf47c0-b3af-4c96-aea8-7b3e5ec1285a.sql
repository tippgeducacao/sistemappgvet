-- Permitir que vendedores atualizem suas próprias vendas rejeitadas
CREATE POLICY "Vendedores can update their own rejected sales" 
ON public.form_entries 
FOR UPDATE 
USING (
  vendedor_id = auth.uid() 
  AND status = 'desistiu'
);