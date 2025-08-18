-- Primeiro, vamos remover a constraint existente se ela existir
ALTER TABLE niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_nivel_check;

-- Agora vamos adicionar uma nova constraint que inclui 'supervisor'
ALTER TABLE niveis_vendedores ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'supervisor'));

-- Adicionar o tipo_usuario supervisor se não existir na constraint
ALTER TABLE niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_tipo_usuario_check;
ALTER TABLE niveis_vendedores ADD CONSTRAINT niveis_vendedores_tipo_usuario_check 
CHECK (tipo_usuario IN ('vendedor', 'sdr', 'supervisor'));

-- Agora inserir o registro de supervisor
INSERT INTO niveis_vendedores (
  nivel, 
  tipo_usuario, 
  fixo_mensal, 
  vale, 
  variavel_semanal, 
  meta_semanal_vendedor, 
  meta_semanal_inbound, 
  meta_semanal_outbound, 
  meta_vendas_cursos
) 
VALUES (
  'supervisor',
  'supervisor', 
  5000.00, 
  500.00, 
  1000.00, 
  0, 
  0, 
  0, 
  0
)
ON CONFLICT (nivel, tipo_usuario) DO NOTHING;