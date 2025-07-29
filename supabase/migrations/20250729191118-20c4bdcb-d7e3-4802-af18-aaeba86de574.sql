-- Atualizar a estrutura de horario_trabalho para incluir horário de sábado
-- Primeiro vamos verificar a estrutura atual e adicionar os campos de sábado se necessário

-- Para profiles que já existem, vamos atualizar o JSON de horario_trabalho para incluir sábado
UPDATE profiles 
SET horario_trabalho = jsonb_set(
  jsonb_set(
    COALESCE(horario_trabalho, '{"manha_inicio": "09:00", "manha_fim": "12:00", "tarde_inicio": "13:00", "tarde_fim": "18:00"}'::jsonb),
    '{sabado_inicio}', 
    '"08:00"'::jsonb
  ),
  '{sabado_fim}', 
  '"12:00"'::jsonb
)
WHERE horario_trabalho IS NULL OR NOT (horario_trabalho ? 'sabado_inicio');