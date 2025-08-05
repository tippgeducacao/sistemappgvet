-- Remover políticas duplicadas e criar políticas mais claras para form_entries
DROP POLICY "Secretarias can view all sales" ON public.form_entries;

-- Atualizar a política principal de SELECT para ser mais clara
DROP POLICY "Admins, secretarias e diretores can view all sales" ON public.form_entries;
CREATE POLICY "Admins, secretarias, diretores e vendedores podem ver vendas" 
ON public.form_entries 
FOR SELECT 
USING (
  -- Vendedores podem ver suas próprias vendas
  vendedor_id = auth.uid() 
  OR 
  -- Admins, secretarias e diretores podem ver todas as vendas
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  -- Verificação adicional via user_roles
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);

-- Verificar se as políticas estão corretas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'form_entries' 
ORDER BY cmd, policyname;