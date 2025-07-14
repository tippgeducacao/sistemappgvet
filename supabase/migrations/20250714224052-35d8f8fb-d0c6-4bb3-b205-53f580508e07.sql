-- Corrigir políticas RLS da tabela form_entries para permitir updates de diretores

-- Remover políticas problemáticas  
DROP POLICY IF EXISTS "Secretarias can view all sales" ON public.form_entries;
DROP POLICY IF EXISTS "Diretores can view all sales" ON public.form_entries;

-- Recriar política de visualização que inclui diretores
CREATE POLICY "Admins, secretarias e diretores can view all sales" 
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

-- Criar política de UPDATE específica para admin, secretaria e diretor
CREATE POLICY "Admins, secretarias e diretores can update all sales" 
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