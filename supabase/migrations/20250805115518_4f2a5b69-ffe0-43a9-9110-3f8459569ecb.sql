-- Corrigir níveis inconsistentes de SDRs
-- Atualizar SDRs inbound que têm nível de vendedor para nível SDR correto
UPDATE public.profiles 
SET nivel = CASE 
  WHEN nivel = 'junior' THEN 'sdr_inbound_junior'
  WHEN nivel = 'pleno' THEN 'sdr_inbound_pleno' 
  WHEN nivel = 'senior' THEN 'sdr_inbound_senior'
  ELSE nivel
END
WHERE user_type = 'sdr_inbound' 
AND nivel IN ('junior', 'pleno', 'senior');

-- Atualizar SDRs outbound que têm nível de vendedor para nível SDR correto
UPDATE public.profiles 
SET nivel = CASE 
  WHEN nivel = 'junior' THEN 'sdr_outbound_junior'
  WHEN nivel = 'pleno' THEN 'sdr_outbound_pleno' 
  WHEN nivel = 'senior' THEN 'sdr_outbound_senior'
  ELSE nivel
END
WHERE user_type = 'sdr_outbound' 
AND nivel IN ('junior', 'pleno', 'senior');