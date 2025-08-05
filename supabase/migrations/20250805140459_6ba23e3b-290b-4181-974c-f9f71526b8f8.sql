-- Mover os cursos CLÍNICA MÉDICA DE BOVINOS e CLÍNICA MÉDICA E CIRÚRGICA DE BOVINOS 
-- do grupo "02" para o grupo "01" de Bovinos onde já existe o vendedor Carlos

UPDATE grupos_pos_graduacoes_cursos 
SET grupo_id = '1f548232-e1f6-43e8-95ad-ad80dc8794ca'  -- Grupo "01 -🐄Pós-graduações na área de Bovinos"
WHERE grupo_id = '292f2895-5f3a-48e0-8fd9-87110f244191'  -- Grupo "02 - 🐄Pós-graduações na área de Bovinos"
  AND curso_id IN (
    SELECT id FROM cursos 
    WHERE nome IN ('CLÍNICA MÉDICA DE BOVINOS', 'CLÍNICA MÉDICA E CIRÚRGICA DE BOVINOS')
  );