-- Corrigir políticas RLS para permitir que SDRs vejam dados necessários para agenda

-- Adicionar política para SDRs verem perfis dos vendedores (necessário para agenda)
CREATE POLICY "SDRs can view vendor profiles for scheduling" ON public.profiles
  FOR SELECT
  USING (
    public.get_current_user_type() = 'sdr' 
    AND user_type IN ('vendedor', 'sdr')
  );

-- Verificar e ajustar políticas de agendamentos para SDRs
-- A política existente já permite, mas vamos garantir que está correta
DROP POLICY IF EXISTS "SDRs podem ver agendamentos relacionados" ON public.agendamentos;

CREATE POLICY "SDRs podem ver agendamentos relacionados" ON public.agendamentos
  FOR SELECT
  USING (
    -- SDRs podem ver agendamentos onde são o SDR responsável
    sdr_id = auth.uid() 
    OR 
    -- SDRs podem ver agendamentos de vendedores para coordenação
    (EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')
    ))
  );

-- Garantir que SDRs possam ver leads para agendamentos
DROP POLICY IF EXISTS "SDRs podem ver todos os leads para agendamento" ON public.leads;

CREATE POLICY "SDRs podem ver todos os leads para agendamento" ON public.leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.user_type IN ('sdr', 'sdr_inbound', 'sdr_outbound')
    )
  );