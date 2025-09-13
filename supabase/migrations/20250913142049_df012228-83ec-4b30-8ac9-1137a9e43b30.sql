-- Criar função para buscar vendas candidatas para vinculação de agendamentos
CREATE OR REPLACE FUNCTION public.buscar_vendas_candidatas_para_agendamento(p_agendamento_id uuid)
 RETURNS TABLE(
   form_entry_id uuid,
   aluno_nome text,
   aluno_email text,
   aluno_telefone text,
   curso_nome text,
   status text,
   pontuacao_validada numeric,
   data_aprovacao timestamp with time zone,
   vendedor_nome text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  agendamento_record RECORD;
  lead_record RECORD;
BEGIN
  -- Buscar dados do agendamento e lead
  SELECT a.*, l.nome as lead_nome, l.email as lead_email, l.whatsapp as lead_whatsapp
  INTO agendamento_record
  FROM public.agendamentos a
  JOIN public.leads l ON l.id = a.lead_id
  WHERE a.id = p_agendamento_id;
  
  -- Se não encontrar o agendamento, retornar vazio
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Buscar vendas candidatas do mesmo vendedor
  RETURN QUERY
  SELECT 
    fe.id as form_entry_id,
    al.nome as aluno_nome,
    al.email as aluno_email,
    al.telefone as aluno_telefone,
    c.nome as curso_nome,
    fe.status,
    fe.pontuacao_validada,
    fe.data_aprovacao,
    p.name as vendedor_nome
  FROM public.form_entries fe
  JOIN public.alunos al ON al.form_entry_id = fe.id
  JOIN public.cursos c ON c.id = fe.curso_id
  JOIN public.profiles p ON p.id = fe.vendedor_id
  WHERE fe.vendedor_id = agendamento_record.vendedor_id
    AND fe.status IN ('matriculado', 'pendente', 'desistiu')
    AND (
      -- Correspondência por email (mais confiável)
      (LOWER(TRIM(al.email)) ILIKE '%' || LOWER(TRIM(agendamento_record.lead_email)) || '%' 
       AND agendamento_record.lead_email IS NOT NULL 
       AND al.email IS NOT NULL)
      OR
      (LOWER(TRIM(agendamento_record.lead_email)) ILIKE '%' || LOWER(TRIM(al.email)) || '%' 
       AND agendamento_record.lead_email IS NOT NULL 
       AND al.email IS NOT NULL)
      OR
      -- Correspondência por nome (menos confiável, mas útil)
      (LOWER(TRIM(al.nome)) ILIKE '%' || LOWER(TRIM(agendamento_record.lead_nome)) || '%' 
       AND agendamento_record.lead_nome IS NOT NULL 
       AND al.nome IS NOT NULL)
      OR
      (LOWER(TRIM(agendamento_record.lead_nome)) ILIKE '%' || LOWER(TRIM(al.nome)) || '%' 
       AND agendamento_record.lead_nome IS NOT NULL 
       AND al.nome IS NOT NULL)
      OR
      -- Correspondência por telefone/whatsapp
      (regexp_replace(COALESCE(al.telefone, ''), '[^0-9]', '', 'g') = 
       regexp_replace(COALESCE(agendamento_record.lead_whatsapp, ''), '[^0-9]', '', 'g')
       AND agendamento_record.lead_whatsapp IS NOT NULL 
       AND al.telefone IS NOT NULL
       AND LENGTH(regexp_replace(COALESCE(al.telefone, ''), '[^0-9]', '', 'g')) >= 10)
    )
  ORDER BY 
    -- Priorizar por tipo de correspondência
    CASE 
      WHEN LOWER(TRIM(al.email)) = LOWER(TRIM(agendamento_record.lead_email)) THEN 1 -- Email exato
      WHEN LOWER(TRIM(al.nome)) = LOWER(TRIM(agendamento_record.lead_nome)) THEN 2   -- Nome exato
      ELSE 3 -- Correspondência parcial
    END,
    fe.created_at DESC;
END;
$function$;