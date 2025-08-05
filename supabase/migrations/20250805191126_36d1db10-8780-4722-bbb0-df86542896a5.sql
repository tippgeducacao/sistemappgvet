-- Atualizar política RLS para permitir que SDRs também criem vendas
DROP POLICY IF EXISTS "Vendedores can create form entries" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem criar vendas" 
ON public.form_entries 
FOR INSERT 
WITH CHECK (
  (vendedor_id = auth.uid()) 
  AND 
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE (profiles.id = auth.uid()) 
    AND (profiles.user_type = ANY (ARRAY['vendedor'::text, 'sdr_inbound'::text, 'sdr_outbound'::text]))
  ))
);

-- Também atualizar a política de atualização para SDRs
DROP POLICY IF EXISTS "Vendedores can update their own sales" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem atualizar suas vendas" 
ON public.form_entries 
FOR UPDATE 
USING (vendedor_id = auth.uid())
WITH CHECK (
  (vendedor_id = auth.uid())
  AND 
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE (profiles.id = auth.uid()) 
    AND (profiles.user_type = ANY (ARRAY['vendedor'::text, 'sdr_inbound'::text, 'sdr_outbound'::text]))
  ))
);

-- Atualizar política de visualização para SDRs
DROP POLICY IF EXISTS "Vendedores can view their own sales" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem ver suas vendas" 
ON public.form_entries 
FOR SELECT 
USING (
  (vendedor_id = auth.uid())
  OR 
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE (profiles.id = auth.uid()) 
    AND (profiles.user_type = ANY (ARRAY['admin'::text, 'secretaria'::text, 'diretor'::text]))
  ))
);