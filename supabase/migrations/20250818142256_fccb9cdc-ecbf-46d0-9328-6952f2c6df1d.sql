-- Atualizar constraint para incluir todos os tipos existentes
ALTER TABLE niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_tipo_usuario_check;
ALTER TABLE niveis_vendedores ADD CONSTRAINT niveis_vendedores_tipo_usuario_check 
CHECK (tipo_usuario IN ('vendedor', 'sdr', 'supervisor', 'coordenador'));

-- Adicionar um registro único para supervisor geral se não existir
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