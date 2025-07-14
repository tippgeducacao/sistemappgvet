-- Adicionar o tipo 'sdr' ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'sdr';

-- Atualizar as políticas RLS existentes para incluir SDRs onde apropriado
-- Política para leads - SDRs podem ver e gerenciar leads
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

CREATE POLICY "Authenticated users can manage leads" 
  ON public.leads 
  FOR ALL 
  USING (auth.role() = 'authenticated'::text);

-- Política para lead_interactions - SDRs podem criar interações
DROP POLICY IF EXISTS "Users can create lead interactions" ON public.lead_interactions;
DROP POLICY IF EXISTS "Users can view lead interactions" ON public.lead_interactions;

CREATE POLICY "Users can create lead interactions" 
  ON public.lead_interactions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can view lead interactions" 
  ON public.lead_interactions 
  FOR SELECT 
  USING (auth.role() = 'authenticated'::text);

-- SDRs podem ver vendas mas não podem criar
CREATE POLICY "SDRs can view form entries" 
  ON public.form_entries 
  FOR SELECT 
  USING (EXISTS ( 
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'sdr'::app_role
  ));

-- SDRs podem ver alunos
CREATE POLICY "SDRs can view alunos" 
  ON public.alunos 
  FOR SELECT 
  USING (EXISTS ( 
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'sdr'::app_role
  ));

-- SDRs podem ver cursos
-- (já está coberto pela política existente que permite usuários autenticados verem cursos ativos)