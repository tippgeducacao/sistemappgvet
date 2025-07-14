-- Reestruturar tabela niveis_vendedores para ter metas separadas de inbound e outbound
-- Primeiro, limpar dados de SDR existentes
DELETE FROM public.niveis_vendedores WHERE tipo_usuario = 'sdr';

-- Alterar constraint para níveis corretos
ALTER TABLE public.niveis_vendedores 
DROP CONSTRAINT niveis_vendedores_nivel_check;

ALTER TABLE public.niveis_vendedores 
ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'sdr_junior', 'sdr_pleno', 'sdr_senior'));

-- Adicionar colunas para metas separadas de inbound e outbound
ALTER TABLE public.niveis_vendedores 
ADD COLUMN meta_semanal_inbound integer DEFAULT 0,
ADD COLUMN meta_semanal_outbound integer DEFAULT 0;

-- Renomear coluna existente para deixar claro que é para vendedores
ALTER TABLE public.niveis_vendedores 
RENAME COLUMN meta_semanal_pontos TO meta_semanal_vendedor;

-- Inserir níveis de SDR baseados na tabela da imagem
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
('sdr_junior', 'sdr', 1800, 400, 450, 0, 55, 27),
('sdr_pleno', 'sdr', 2000, 400, 500, 0, 60, 30),
('sdr_senior', 'sdr', 2200, 400, 550, 0, 65, 35);

-- Atualizar comentários
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_vendedor IS 'Meta semanal em pontos para vendedores';
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_inbound IS 'Meta semanal de reuniões para SDR Inbound';
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_outbound IS 'Meta semanal de reuniões para SDR Outbound';