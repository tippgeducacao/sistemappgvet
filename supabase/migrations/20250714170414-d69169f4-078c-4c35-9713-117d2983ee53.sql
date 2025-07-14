-- Expandir tabela niveis_vendedores para incluir SDRs
-- Primeiro, alterar o enum do campo nivel para incluir tipos de SDR
ALTER TABLE public.niveis_vendedores 
DROP CONSTRAINT niveis_vendedores_nivel_check;

-- Adicionar novos tipos de nível incluindo SDRs
ALTER TABLE public.niveis_vendedores 
ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'sdr_inbound', 'sdr_outbound'));

-- Adicionar campo para tipo de usuário (vendedor ou sdr)
ALTER TABLE public.niveis_vendedores 
ADD COLUMN tipo_usuario TEXT NOT NULL DEFAULT 'vendedor' 
CHECK (tipo_usuario IN ('vendedor', 'sdr'));

-- Atualizar registros existentes
UPDATE public.niveis_vendedores 
SET tipo_usuario = 'vendedor' 
WHERE nivel IN ('junior', 'pleno', 'senior');

-- Inserir níveis padrão para SDRs baseados na imagem
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, fixo_mensal, vale, variavel_semanal, meta_semanal_pontos) VALUES
('sdr_inbound', 'sdr', 1800, 400, 450, 55),
('sdr_outbound', 'sdr', 2000, 400, 500, 60);

-- Atualizar comentários
COMMENT ON COLUMN public.niveis_vendedores.nivel IS 'Nível: junior, pleno, senior (vendedores) ou sdr_inbound, sdr_outbound (SDRs)';
COMMENT ON COLUMN public.niveis_vendedores.tipo_usuario IS 'Tipo de usuário: vendedor ou sdr';
COMMENT ON TABLE public.niveis_vendedores IS 'Configuração de níveis e metas dos vendedores e SDRs';