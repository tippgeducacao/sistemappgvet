-- Adicionar dados de supervisor na tabela niveis_vendedores se não existir
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