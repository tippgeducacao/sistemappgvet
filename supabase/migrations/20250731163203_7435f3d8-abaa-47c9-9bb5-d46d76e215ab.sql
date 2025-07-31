-- Inserir cursos de teste se não existirem
INSERT INTO cursos (id, nome, modalidade, ativo)
SELECT 
  gen_random_uuid(),
  'Curso Teste ' || generate_series,
  CASE 
    WHEN generate_series % 2 = 0 THEN 'Pós-graduação'
    ELSE 'Curso'
  END,
  true
FROM generate_series(1, 8)
WHERE NOT EXISTS (
  SELECT 1 FROM cursos WHERE nome LIKE 'Curso Teste%'
);

-- Inserir leads de teste
INSERT INTO leads (id, nome, email, whatsapp, status)
SELECT 
  gen_random_uuid(),
  'Lead Teste ' || generate_series,
  'lead' || generate_series || '@teste.com',
  '11999' || LPAD(generate_series::text, 6, '0'),
  'qualificado'
FROM generate_series(1, 30)
WHERE NOT EXISTS (
  SELECT 1 FROM leads WHERE email LIKE 'lead%@teste.com'
);

-- Inserir vendas aleatórias para as últimas 3 semanas usando vendedores existentes
WITH vendedores_existentes AS (
  SELECT id FROM profiles WHERE user_type = 'vendedor' LIMIT 5
),
cursos_teste AS (
  SELECT id FROM cursos WHERE nome LIKE 'Curso Teste%'
),
semanas AS (
  -- Últimas 3 semanas (quarta-feira como início)
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM CURRENT_DATE) >= 3 THEN 
        CURRENT_DATE - INTERVAL '7 days' * (EXTRACT(DOW FROM CURRENT_DATE) - 3) - INTERVAL '7 days' * (n - 1)
      ELSE 
        CURRENT_DATE - INTERVAL '7 days' * (EXTRACT(DOW FROM CURRENT_DATE) + 4) - INTERVAL '7 days' * (n - 1)
    END AS quarta_feira
  FROM generate_series(0, 2) AS n
),
vendas_aleatorias AS (
  SELECT 
    gen_random_uuid() as id,
    (SELECT id FROM vendedores_existentes ORDER BY RANDOM() LIMIT 1) as vendedor_id,
    (SELECT id FROM cursos_teste ORDER BY RANDOM() LIMIT 1) as curso_id,
    'Observações de teste para venda ' || ROW_NUMBER() OVER() as observacoes,
    CASE 
      WHEN RANDOM() < 0.7 THEN 'matriculado'
      ELSE 'desistiu'
    END as status,
    (1 + RANDOM() * 4)::numeric(5,2) as pontuacao_esperada,
    (1 + RANDOM() * 4)::numeric(5,2) as pontuacao_validada,
    -- Data aleatória dentro da semana (quarta a terça)
    s.quarta_feira + INTERVAL '1 day' * (RANDOM() * 6)::int + 
    INTERVAL '1 hour' * (8 + RANDOM() * 10)::int as enviado_em,
    NOW() as atualizado_em,
    NOW() as created_at,
    NOW() as data_aprovacao
  FROM semanas s
  CROSS JOIN generate_series(1, 6) -- 6 vendas por semana
)
INSERT INTO form_entries (
  id, vendedor_id, curso_id, observacoes, status, 
  pontuacao_esperada, pontuacao_validada, enviado_em, 
  atualizado_em, created_at, data_aprovacao
)
SELECT * FROM vendas_aleatorias
WHERE NOT EXISTS (
  SELECT 1 FROM form_entries WHERE observacoes LIKE 'Observações de teste para venda%'
);

-- Inserir alunos para as vendas de teste
INSERT INTO alunos (id, nome, email, telefone, crmv, vendedor_id, form_entry_id)
SELECT 
  gen_random_uuid(),
  'Aluno Teste ' || ROW_NUMBER() OVER(),
  'aluno' || ROW_NUMBER() OVER() || '@teste.com',
  '11999' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
  'CRMV-SP-' || (10000 + ROW_NUMBER() OVER()),
  fe.vendedor_id,
  fe.id
FROM form_entries fe
WHERE fe.observacoes LIKE 'Observações de teste para venda%'
AND NOT EXISTS (
  SELECT 1 FROM alunos WHERE form_entry_id = fe.id
);

-- Inserir agendamentos/reuniões finalizadas para as últimas 3 semanas
WITH vendedores_existentes AS (
  SELECT id FROM profiles WHERE user_type = 'vendedor' LIMIT 5
),
sdrs_existentes AS (
  SELECT id FROM profiles WHERE user_type IN ('sdr_inbound', 'sdr_outbound') LIMIT 3
),
leads_teste AS (
  SELECT id FROM leads WHERE email LIKE 'lead%@teste.com'
),
semanas AS (
  -- Últimas 3 semanas (quarta-feira como início)
  SELECT 
    CASE 
      WHEN EXTRACT(DOW FROM CURRENT_DATE) >= 3 THEN 
        CURRENT_DATE - INTERVAL '7 days' * (EXTRACT(DOW FROM CURRENT_DATE) - 3) - INTERVAL '7 days' * (n - 1)
      ELSE 
        CURRENT_DATE - INTERVAL '7 days' * (EXTRACT(DOW FROM CURRENT_DATE) + 4) - INTERVAL '7 days' * (n - 1)
    END AS quarta_feira
  FROM generate_series(0, 2) AS n
),
reunioes_aleatorias AS (
  SELECT 
    gen_random_uuid() as id,
    (SELECT id FROM leads_teste ORDER BY RANDOM() LIMIT 1) as lead_id,
    (SELECT id FROM vendedores_existentes ORDER BY RANDOM() LIMIT 1) as vendedor_id,
    COALESCE((SELECT id FROM sdrs_existentes ORDER BY RANDOM() LIMIT 1), (SELECT id FROM vendedores_existentes ORDER BY RANDOM() LIMIT 1)) as sdr_id,
    'Especialização em Cardiologia Veterinária' as pos_graduacao_interesse,
    -- Data aleatória dentro da semana (quarta a terça)
    s.quarta_feira + INTERVAL '1 day' * (RANDOM() * 6)::int + 
    INTERVAL '1 hour' * (9 + RANDOM() * 8)::int as data_agendamento,
    s.quarta_feira + INTERVAL '1 day' * (RANDOM() * 6)::int + 
    INTERVAL '1 hour' * (9 + RANDOM() * 8)::int + INTERVAL '1 hour' as data_fim_agendamento,
    'https://meet.google.com/teste-' || SUBSTRING(gen_random_uuid()::text, 1, 8) as link_reuniao,
    'finalizado' as status,
    CASE 
      WHEN RANDOM() < 0.6 THEN 'interessado'
      WHEN RANDOM() < 0.8 THEN 'nao_interessado'
      ELSE 'reagendar'
    END as resultado_reuniao,
    'Reunião finalizada com sucesso - teste ' || ROW_NUMBER() OVER() as observacoes,
    'Observações do resultado da reunião de teste' as observacoes_resultado,
    NOW() as data_resultado,
    NOW() as created_at,
    NOW() as updated_at
  FROM semanas s
  CROSS JOIN generate_series(1, 4) -- 4 reuniões por semana
)
INSERT INTO agendamentos (
  id, lead_id, vendedor_id, sdr_id, pos_graduacao_interesse,
  data_agendamento, data_fim_agendamento, link_reuniao, status,
  resultado_reuniao, observacoes, observacoes_resultado, data_resultado,
  created_at, updated_at
)
SELECT * FROM reunioes_aleatorias
WHERE NOT EXISTS (
  SELECT 1 FROM agendamentos WHERE observacoes LIKE 'Reunião finalizada com sucesso - teste%'
);