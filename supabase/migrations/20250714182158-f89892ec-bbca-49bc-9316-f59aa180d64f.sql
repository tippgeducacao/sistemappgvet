-- Reestruturar níveis de SDR para separar Inbound e Outbound
-- Primeiro, remover SDRs existentes
DELETE FROM public.niveis_vendedores WHERE tipo_usuario = 'sdr';

-- Atualizar constraint para novos níveis especializados
ALTER TABLE public.niveis_vendedores 
DROP CONSTRAINT niveis_vendedores_nivel_check;

ALTER TABLE public.niveis_vendedores 
ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'sdr_inbound_junior', 'sdr_inbound_pleno', 'sdr_inbound_senior', 'sdr_outbound_junior', 'sdr_outbound_pleno', 'sdr_outbound_senior'));

-- Inserir níveis de SDR Inbound (só meta inbound)
INSERT INTO public.niveis_vendedores (
  nivel, 
  tipo_usuario, 
  fixo_mensal, 
  vale, 
  variavel_semanal, 
  meta_semanal_vendedor,
  meta_semanal_inbound,
  meta_semanal_outbound
) VALUES
('sdr_inbound_junior', 'sdr', 1800, 400, 450, 0, 55, 0),
('sdr_inbound_pleno', 'sdr', 2000, 400, 500, 0, 60, 0),
('sdr_inbound_senior', 'sdr', 2200, 400, 550, 0, 65, 0);

-- Inserir níveis de SDR Outbound (só meta outbound)
INSERT INTO public.niveis_vendedores (
  nivel, 
  tipo_usuario, 
  fixo_mensal, 
  vale, 
  variavel_semanal, 
  meta_semanal_vendedor,
  meta_semanal_inbound,
  meta_semanal_outbound
) VALUES
('sdr_outbound_junior', 'sdr', 1800, 400, 450, 0, 0, 27),
('sdr_outbound_pleno', 'sdr', 2000, 400, 500, 0, 0, 30),
('sdr_outbound_senior', 'sdr', 2200, 400, 550, 0, 0, 35);

-- Atualizar comentários
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_inbound IS 'Meta semanal de reuniões para SDR Inbound (0 para vendedores e SDR Outbound)';
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_outbound IS 'Meta semanal de reuniões para SDR Outbound (0 para vendedores e SDR Inbound)';