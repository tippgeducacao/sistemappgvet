-- Corrigir as políticas RLS para form_entries
-- Remover as políticas duplicadas e garantir que vendedores vejam suas próprias vendas

-- Primeiro, remover todas as políticas existentes para recriar
DROP POLICY IF EXISTS "Vendedores can view their own sales" ON public.form_entries;
DROP POLICY IF EXISTS "Secretarias can view all sales" ON public.form_entries;
DROP POLICY IF EXISTS "Diretores can view all sales" ON public.form_entries;

-- Recriar as políticas de forma mais clara
CREATE POLICY "Vendedores can view their own sales"
ON public.form_entries
FOR SELECT
USING (vendedor_id = auth.uid());

CREATE POLICY "Secretarias can view all sales"
ON public.form_entries
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
  AND user_type IN ('secretaria', 'admin', 'diretor')
));