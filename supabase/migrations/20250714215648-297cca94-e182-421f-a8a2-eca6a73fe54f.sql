-- Adicionar políticas RLS para respostas_formulario
CREATE POLICY "Authenticated users can manage form responses" 
ON public.respostas_formulario 
FOR ALL 
USING (auth.role() = 'authenticated'::text)
WITH CHECK (auth.role() = 'authenticated'::text);

-- Adicionar políticas RLS para permitir admins/secretarias gerenciar regras de pontuação
CREATE POLICY "Admins can manage scoring rules" 
ON public.regras_pontuacao 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'secretaria', 'diretor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'secretaria', 'diretor')
));