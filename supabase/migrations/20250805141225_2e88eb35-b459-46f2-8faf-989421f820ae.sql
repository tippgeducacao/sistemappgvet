-- Reverter as alterações anteriores - voltar os cursos para seus grupos originais

-- 1. Mover CANNABIS MEDICINAL e PLANTAS MEDICINAIS de volta para o grupo "02 -🩺Pós-graduações na área da Saúde"
UPDATE grupos_pos_graduacoes_cursos 
SET grupo_id = '0e61ea46-c418-40e3-9684-c7711c434cee'  -- Grupo "02 -🩺Pós-graduações na área da Saúde"
WHERE grupo_id = '7f248222-091a-49fc-b1bd-9adc23cc2f39'  -- Grupo "01 -🩺Pós-graduações na área da Saúde"
  AND curso_id IN (
    SELECT id FROM cursos 
    WHERE nome IN ('CANNABIS MEDICINAL', 'PLANTAS MEDICINAIS')
  );

-- 2. Mover CLÍNICA MÉDICA DE BOVINOS e CLÍNICA MÉDICA E CIRÚRGICA DE BOVINOS de volta para o grupo "02 - 🐄Pós-graduações na área de Bovinos"
UPDATE grupos_pos_graduacoes_cursos 
SET grupo_id = '292f2895-5f3a-48e0-8fd9-87110f244191'  -- Grupo "02 - 🐄Pós-graduações na área de Bovinos"
WHERE grupo_id = '1f548232-e1f6-43e8-95ad-ad80dc8794ca'  -- Grupo "01 -🐄Pós-graduações na área de Bovinos"
  AND curso_id IN (
    SELECT id FROM cursos 
    WHERE nome IN ('CLÍNICA MÉDICA DE BOVINOS', 'CLÍNICA MÉDICA E CIRÚRGICA DE BOVINOS')
  );