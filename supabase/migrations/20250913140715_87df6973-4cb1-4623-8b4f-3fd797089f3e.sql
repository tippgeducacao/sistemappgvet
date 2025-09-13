-- Atualizar a função vincular_agendamentos_vendas para incluir vendas com status 'desistiu'
CREATE OR REPLACE FUNCTION public.vincular_agendamentos_vendas()
 RETURNS TABLE(agendamento_id uuid, form_entry_id uuid, vendedor_nome text, lead_email text, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  agendamento_record RECORD;
  venda_record RECORD;
  update_count INTEGER := 0;
BEGIN
  -- Buscar agendamentos com status "comprou" que não têm form_entry_id vinculado
  FOR agendamento_record IN 
    SELECT 
      a.id as agendamento_id,
      a.vendedor_id,
      a.sdr_id,
      l.email as lead_email,
      l.nome as lead_nome,
      p.name as vendedor_nome
    FROM agendamentos a
    JOIN leads l ON l.id = a.lead_id
    JOIN profiles p ON p.id = a.vendedor_id
    WHERE a.resultado_reuniao = 'comprou' 
    AND a.form_entry_id IS NULL
    ORDER BY a.data_agendamento DESC
  LOOP
    -- Buscar venda correspondente por vendedor e email do lead (incluindo vendas com status 'desistiu')
    SELECT fe.* INTO venda_record
    FROM form_entries fe
    JOIN alunos al ON al.form_entry_id = fe.id
    WHERE fe.vendedor_id = agendamento_record.vendedor_id
    AND LOWER(TRIM(al.email)) = LOWER(TRIM(agendamento_record.lead_email))
    AND fe.status IN ('matriculado', 'pendente', 'desistiu')
    ORDER BY fe.created_at DESC
    LIMIT 1;

    IF FOUND THEN
      -- Vincular o agendamento à venda
      UPDATE agendamentos 
      SET 
        form_entry_id = venda_record.id,
        updated_at = now()
      WHERE id = agendamento_record.agendamento_id;
      
      -- Atualizar a venda com o SDR se não tiver
      IF venda_record.sdr_id IS NULL AND agendamento_record.sdr_id IS NOT NULL THEN
        UPDATE form_entries
        SET 
          sdr_id = agendamento_record.sdr_id,
          atualizado_em = now()
        WHERE id = venda_record.id;
      END IF;

      update_count := update_count + 1;
      
      RETURN QUERY SELECT 
        agendamento_record.agendamento_id,
        venda_record.id,
        agendamento_record.vendedor_nome,
        agendamento_record.lead_email,
        TRUE,
        'Vinculação realizada com sucesso'::TEXT;
    ELSE
      -- Tentar buscar por similaridade de nome se email não funcionou (incluindo vendas com status 'desistiu')
      SELECT fe.* INTO venda_record
      FROM form_entries fe
      JOIN alunos al ON al.form_entry_id = fe.id
      WHERE fe.vendedor_id = agendamento_record.vendedor_id
      AND LOWER(TRIM(al.nome)) = LOWER(TRIM(agendamento_record.lead_nome))
      AND fe.status IN ('matriculado', 'pendente', 'desistiu')
      ORDER BY fe.created_at DESC
      LIMIT 1;

      IF FOUND THEN
        -- Vincular o agendamento à venda encontrada por nome
        UPDATE agendamentos 
        SET 
          form_entry_id = venda_record.id,
          updated_at = now()
        WHERE id = agendamento_record.agendamento_id;
        
        -- Atualizar a venda com o SDR se não tiver
        IF venda_record.sdr_id IS NULL AND agendamento_record.sdr_id IS NOT NULL THEN
          UPDATE form_entries
          SET 
            sdr_id = agendamento_record.sdr_id,
            atualizado_em = now()
          WHERE id = venda_record.id;
        END IF;

        update_count := update_count + 1;
        
        RETURN QUERY SELECT 
          agendamento_record.agendamento_id,
          venda_record.id,
          agendamento_record.vendedor_nome,
          agendamento_record.lead_email,
          TRUE,
          'Vinculação realizada por nome'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          agendamento_record.agendamento_id,
          NULL::UUID,
          agendamento_record.vendedor_nome,
          agendamento_record.lead_email,
          FALSE,
          'Venda correspondente não encontrada'::TEXT;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Vinculações realizadas: %', update_count;
END;
$function$;