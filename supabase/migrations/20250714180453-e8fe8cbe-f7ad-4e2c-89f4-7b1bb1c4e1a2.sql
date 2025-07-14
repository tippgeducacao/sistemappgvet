-- Primeiro, remover dados de SDR antigos que conflitam
DELETE FROM public.niveis_vendedores WHERE nivel IN ('sdr_inbound', 'sdr_outbound');

-- Depois, alterar o constraint para incluir todos os níveis
ALTER TABLE public.niveis_vendedores 
DROP CONSTRAINT niveis_vendedores_nivel_check;

ALTER TABLE public.niveis_vendedores 
ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN (
  'junior', 'pleno', 'senior', 
  'sdr_inbound_junior', 'sdr_inbound_pleno', 'sdr_inbound_senior',
  'sdr_outbound_junior', 'sdr_outbound_pleno', 'sdr_outbound_senior'
));

-- Inserir níveis detalhados para SDRs
-- SDR Inbound
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, fixo_mensal, vale, variavel_semanal, meta_semanal_pontos) VALUES
('sdr_inbound_junior', 'sdr', 1500, 400, 300, 8),
('sdr_inbound_pleno', 'sdr', 1800, 400, 450, 12),
('sdr_inbound_senior', 'sdr', 2200, 400, 600, 16);

-- SDR Outbound  
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, fixo_mensal, vale, variavel_semanal, meta_semanal_pontos) VALUES
('sdr_outbound_junior', 'sdr', 1600, 400, 350, 10),
('sdr_outbound_pleno', 'sdr', 2000, 400, 500, 14),
('sdr_outbound_senior', 'sdr', 2400, 400, 650, 18);

-- Atualizar comentários
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_pontos IS 'Meta semanal: pontos para vendedores, reuniões para SDRs (cada reunião = 1 ponto)';