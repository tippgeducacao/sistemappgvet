-- Remover todos os registros de supervisor existentes
DELETE FROM niveis_vendedores WHERE tipo_usuario = 'supervisor';

-- Inserir apenas UM registro único para supervisor
INSERT INTO niveis_vendedores (
  nivel, 
  tipo_usuario, 
  fixo_mensal, 
  vale, 
  variavel_semanal, 
  meta_semanal_vendedor, 
  meta_semanal_inbound, 
  meta_semanal_outbound, 
  meta_vendas_cursos,
  bonus_reuniao_b2b
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
  0,
  50.00
);