-- Criar evento recorrente de reunião de alinhamento às quartas-feiras
INSERT INTO public.eventos_especiais (
  titulo,
  descricao,
  data_inicio,
  data_fim,
  is_recorrente,
  tipo_recorrencia,
  dias_semana,
  hora_inicio,
  hora_fim,
  data_inicio_recorrencia,
  data_fim_recorrencia,
  created_by
) VALUES (
  'Reunião de alinhamento',
  'Reunião semanal de alinhamento da equipe',
  '2025-01-01T14:00:00',
  '2025-12-31T15:00:00',
  true,
  'semanal',
  ARRAY[3], -- 3 = quarta-feira (0=domingo, 1=segunda, 2=terça, 3=quarta, etc.)
  '14:00',
  '15:00',
  '2025-01-01',
  '2025-12-31'
) ON CONFLICT DO NOTHING;