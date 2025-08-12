-- Fix security vulnerability in leads table
-- Remove overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

-- Create secure policies for leads table

-- Directors can manage all leads
CREATE POLICY "Diretores podem gerenciar todos os leads" 
ON public.leads 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'diretor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'diretor'
  )
);

-- Admins can manage all leads
CREATE POLICY "Admins podem gerenciar todos os leads" 
ON public.leads 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Secretarias can manage all leads (they handle sales processes)
CREATE POLICY "Secretarias podem gerenciar todos os leads" 
ON public.leads 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'secretaria'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'secretaria'
  )
);

-- SDRs can view and update leads assigned to them or that they're working with
CREATE POLICY "SDRs podem ver leads atribuidos a eles" 
ON public.leads 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('sdr_inbound', 'sdr_outbound', 'sdr')
  ) AND (
    vendedor_atribuido = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agendamentos 
      WHERE lead_id = leads.id AND sdr_id = auth.uid()
    )
  )
);

-- SDRs can update leads they're working with
CREATE POLICY "SDRs podem atualizar leads que trabalham" 
ON public.leads 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('sdr_inbound', 'sdr_outbound', 'sdr')
  ) AND (
    vendedor_atribuido = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.agendamentos 
      WHERE lead_id = leads.id AND sdr_id = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('sdr_inbound', 'sdr_outbound', 'sdr')
  )
);

-- SDRs can create new leads
CREATE POLICY "SDRs podem criar novos leads" 
ON public.leads 
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type IN ('sdr_inbound', 'sdr_outbound', 'sdr')
  )
);

-- Vendedores can view leads assigned to them
CREATE POLICY "Vendedores podem ver leads atribuidos a eles" 
ON public.leads 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'vendedor'
  ) AND vendedor_atribuido = auth.uid()
);

-- Vendedores can update leads assigned to them
CREATE POLICY "Vendedores podem atualizar seus leads" 
ON public.leads 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'vendedor'
  ) AND vendedor_atribuido = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'vendedor'
  ) AND vendedor_atribuido = auth.uid()
);