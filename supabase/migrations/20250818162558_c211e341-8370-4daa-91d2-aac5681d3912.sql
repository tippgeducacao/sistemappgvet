-- Atualizar constraint do nível para incluir supervisor
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_nivel_check;

-- Criar nova constraint incluindo supervisor
ALTER TABLE profiles ADD CONSTRAINT profiles_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'sdr_inbound_junior', 'sdr_inbound_pleno', 'sdr_inbound_senior', 'sdr_outbound_junior', 'sdr_outbound_pleno', 'sdr_outbound_senior', 'supervisor'));