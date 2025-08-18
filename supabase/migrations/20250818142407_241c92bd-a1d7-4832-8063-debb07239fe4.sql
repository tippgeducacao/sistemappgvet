-- Adicionar 'supervisor' na constraint de nivel
ALTER TABLE niveis_vendedores DROP CONSTRAINT IF EXISTS niveis_vendedores_nivel_check;

-- Como já temos dados com 'supervisor' como nivel, vamos incluir na constraint
ALTER TABLE niveis_vendedores ADD CONSTRAINT niveis_vendedores_nivel_check 
CHECK (nivel IN ('junior', 'pleno', 'senior', 'supervisor'));

-- Agora podemos adicionar um único registro para supervisor se ainda não existir
-- Como já vemos que existem registros junior/pleno/senior supervisor, vamos apenas garantir um único supervisor geral
-- Primeiro, vamos limpar registros duplicados se houver
DELETE FROM niveis_vendedores WHERE nivel = 'supervisor' AND tipo_usuario = 'supervisor';

-- Agora inserir o registro correto
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
);