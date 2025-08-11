-- Migrar todos os usuários SDR para o novo sistema unificado
-- Todos os SDR_INBOUND e SDR_OUTBOUND viram SDR com nível JUNIOR

UPDATE public.profiles 
SET 
  user_type = 'sdr',
  nivel = 'junior'
WHERE user_type IN ('sdr_inbound', 'sdr_outbound');

-- Verificar quantos usuários foram atualizados
-- Comentário: Esta migração converte todos os SDRs existentes para o novo sistema unificado