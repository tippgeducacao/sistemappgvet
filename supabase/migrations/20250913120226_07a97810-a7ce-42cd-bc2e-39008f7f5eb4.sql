-- Função para vincular automaticamente agendamentos às vendas
CREATE OR REPLACE FUNCTION public.vincular_agendamentos_vendas()
RETURNS TABLE(
  agendamento_id UUID,
  form_entry_id UUID,
  vendedor_nome TEXT,
  lead_email TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
    -- Buscar venda correspondente por vendedor e email do lead
    SELECT fe.* INTO venda_record
    FROM form_entries fe
    JOIN alunos al ON al.form_entry_id = fe.id
    WHERE fe.vendedor_id = agendamento_record.vendedor_id
    AND LOWER(TRIM(al.email)) = LOWER(TRIM(agendamento_record.lead_email))
    AND fe.status IN ('matriculado', 'pendente')
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
      -- Tentar buscar por similaridade de nome se email não funcionou
      SELECT fe.* INTO venda_record
      FROM form_entries fe
      JOIN alunos al ON al.form_entry_id = fe.id
      WHERE fe.vendedor_id = agendamento_record.vendedor_id
      AND LOWER(TRIM(al.nome)) = LOWER(TRIM(agendamento_record.lead_nome))
      AND fe.status IN ('matriculado', 'pendente')
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
$$;

-- Trigger para vincular automaticamente quando uma venda é criada
CREATE OR REPLACE FUNCTION public.auto_vincular_agendamento_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  agendamento_record RECORD;
BEGIN
  -- Buscar agendamento correspondente quando uma nova venda é criada
  IF TG_OP = 'INSERT' AND NEW.vendedor_id IS NOT NULL THEN
    -- Buscar agendamento por vendedor que ainda não tem venda vinculada
    SELECT a.* INTO agendamento_record
    FROM agendamentos a
    JOIN leads l ON l.id = a.lead_id
    JOIN alunos al ON al.form_entry_id = NEW.id
    WHERE a.vendedor_id = NEW.vendedor_id
    AND a.form_entry_id IS NULL
    AND a.resultado_reuniao = 'comprou'
    AND (
      LOWER(TRIM(l.email)) = LOWER(TRIM(al.email))
      OR LOWER(TRIM(l.nome)) = LOWER(TRIM(al.nome))
    )
    ORDER BY a.data_agendamento DESC
    LIMIT 1;

    IF FOUND THEN
      -- Vincular o agendamento à nova venda
      UPDATE agendamentos 
      SET 
        form_entry_id = NEW.id,
        updated_at = now()
      WHERE id = agendamento_record.id;
      
      RAISE NOTICE 'Agendamento % automaticamente vinculado à venda %', agendamento_record.id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_auto_vincular_agendamento_venda ON public.form_entries;
CREATE TRIGGER trigger_auto_vincular_agendamento_venda
  AFTER INSERT ON public.form_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_vincular_agendamento_venda();