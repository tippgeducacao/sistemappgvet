-- Adicionar política de UPDATE para admins, secretarias e diretores na tabela niveis_vendedores
CREATE POLICY "Admins podem atualizar níveis" 
ON public.niveis_vendedores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);