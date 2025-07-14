-- Corrigir políticas RLS da tabela alunos
-- Remover política existente se houver
DROP POLICY IF EXISTS "Users can create alunos" ON public.alunos;

-- Política para vendedores verem seus próprios alunos
CREATE POLICY "Vendedores can view their own alunos" 
ON public.alunos 
FOR SELECT 
USING (vendedor_id = auth.uid());

-- Política para vendedores criarem alunos
CREATE POLICY "Vendedores can create alunos" 
ON public.alunos 
FOR INSERT 
WITH CHECK (vendedor_id = auth.uid());

-- Política para vendedores atualizarem seus próprios alunos
CREATE POLICY "Vendedores can update their own alunos" 
ON public.alunos 
FOR UPDATE 
USING (vendedor_id = auth.uid())
WITH CHECK (vendedor_id = auth.uid());

-- Política para secretárias e admins verem todos os alunos
CREATE POLICY "Secretarias and admins can view all alunos" 
ON public.alunos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('secretaria', 'admin', 'diretor')
));

-- Política para secretárias e admins gerenciarem alunos
CREATE POLICY "Secretarias and admins can manage alunos" 
ON public.alunos 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('secretaria', 'admin', 'diretor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('secretaria', 'admin', 'diretor')
));