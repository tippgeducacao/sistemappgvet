-- Corrigir políticas RLS da tabela form_entries para incluir diretores

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own form entries" ON public.form_entries;
DROP POLICY IF EXISTS "Admins and secretaria can update form entries" ON public.form_entries;

-- Criar política para SELECT que inclui diretores
CREATE POLICY "Users can view their own form entries" 
ON public.form_entries 
FOR SELECT 
USING (
  vendedor_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);

-- Criar política para UPDATE que inclui diretores
CREATE POLICY "Admins and secretaria can update form entries" 
ON public.form_entries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'secretaria', 'diretor')
  )
);