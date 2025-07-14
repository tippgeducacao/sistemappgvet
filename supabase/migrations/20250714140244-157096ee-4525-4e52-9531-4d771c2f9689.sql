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