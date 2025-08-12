-- Criar políticas RLS para a tabela leads
-- Permitir que usuários autenticados vejam todos os leads
CREATE POLICY "authenticated_users_can_view_leads" 
ON public.leads 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados criem leads
CREATE POLICY "authenticated_users_can_create_leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Permitir que usuários autenticados atualizem leads
CREATE POLICY "authenticated_users_can_update_leads" 
ON public.leads 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Permitir que usuários autenticados deletem leads
CREATE POLICY "authenticated_users_can_delete_leads" 
ON public.leads 
FOR DELETE 
USING (auth.role() = 'authenticated');