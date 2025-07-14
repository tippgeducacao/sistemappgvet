-- Recriar a política para regras_pontuacao com permissões corretas
DROP POLICY IF EXISTS "Admins can manage scoring rules" ON public.regras_pontuacao;

CREATE POLICY "Diretores can manage scoring rules" 
ON public.regras_pontuacao 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'diretor'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'diretor'
));

-- Garantir que usuários autenticados possam ler regras
CREATE POLICY "All authenticated users can view scoring rules updated" 
ON public.regras_pontuacao 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);