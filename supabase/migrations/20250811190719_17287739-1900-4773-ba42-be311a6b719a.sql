-- Atualizar políticas RLS para incluir o tipo 'sdr' unificado

-- 1. Atualizar política de criação de agendamentos para SDRs
DROP POLICY IF EXISTS "SDRs podem criar agendamentos" ON public.agendamentos;

CREATE POLICY "SDRs podem criar agendamentos" 
ON public.agendamentos
FOR INSERT 
TO public
WITH CHECK (
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['sdr'::text])
  )) 
  AND (sdr_id = auth.uid())
);

-- 2. Atualizar política de visualização de agendamentos
DROP POLICY IF EXISTS "Usuários autenticados podem ver agendamentos" ON public.agendamentos;

CREATE POLICY "Usuários autenticados podem ver agendamentos" 
ON public.agendamentos
FOR SELECT 
TO public
USING (
  (sdr_id = auth.uid()) 
  OR (vendedor_id = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['admin'::text, 'secretaria'::text, 'diretor'::text, 'sdr'::text])
  ))
);

-- 3. Atualizar política de criação de vendas para SDRs
DROP POLICY IF EXISTS "Vendedores e SDRs podem criar vendas" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem criar vendas" 
ON public.form_entries
FOR INSERT 
TO public
WITH CHECK (
  (vendedor_id = auth.uid()) 
  AND (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['vendedor'::text, 'sdr'::text])
  ))
);

-- 4. Atualizar política de atualização de vendas para SDRs
DROP POLICY IF EXISTS "Vendedores e SDRs podem atualizar suas vendas" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem atualizar suas vendas" 
ON public.form_entries
FOR UPDATE 
TO public
USING (vendedor_id = auth.uid())
WITH CHECK (
  (vendedor_id = auth.uid()) 
  AND (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['vendedor'::text, 'sdr'::text])
  ))
);

-- 5. Verificar se há outras políticas que referenciam os tipos antigos
-- Atualizar política de visualização de vendas para incluir SDRs
DROP POLICY IF EXISTS "Vendedores e SDRs podem ver suas vendas" ON public.form_entries;

CREATE POLICY "Vendedores e SDRs podem ver suas vendas" 
ON public.form_entries
FOR SELECT 
TO public
USING (
  (vendedor_id = auth.uid()) 
  OR (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY (ARRAY['admin'::text, 'secretaria'::text, 'diretor'::text])
  ))
);