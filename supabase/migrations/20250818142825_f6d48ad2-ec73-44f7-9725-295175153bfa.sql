-- Adicionar campo para bônus por reunião B2B para supervisores
ALTER TABLE niveis_vendedores ADD COLUMN IF NOT EXISTS bonus_reuniao_b2b NUMERIC DEFAULT 0;

-- Atualizar o registro do supervisor com um valor padrão para o bônus
UPDATE niveis_vendedores 
SET bonus_reuniao_b2b = 50.00 
WHERE nivel = 'supervisor' AND tipo_usuario = 'supervisor';