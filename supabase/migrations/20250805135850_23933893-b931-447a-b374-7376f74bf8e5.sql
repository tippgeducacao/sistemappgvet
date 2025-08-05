-- Mover os cursos CANNABIS MEDICINAL e PLANTAS MEDICINAIS do grupo "02" para o grupo "01" de Saúde
-- onde já existe a vendedora Rhandara Laufer

UPDATE grupos_pos_graduacoes_cursos 
SET grupo_id = '7f248222-091a-49fc-b1bd-9adc23cc2f39'  -- Grupo "01 -🩺Pós-graduações na área da Saúde"
WHERE grupo_id = '0e61ea46-c418-40e3-9684-c7711c434cee'  -- Grupo "02 -🩺Pós-graduações na área da Saúde"
  AND curso_id IN (
    SELECT id FROM cursos 
    WHERE nome IN ('CANNABIS MEDICINAL', 'PLANTAS MEDICINAIS')
  );