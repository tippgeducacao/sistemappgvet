-- Melhorar o trigger de vinculação automática para ser mais robusto
-- Primeiro, deletar o trigger existente se existir
DROP TRIGGER IF EXISTS auto_vincular_agendamento_venda_trigger ON public.form_entries;

-- Criar função melhorada de vinculação automática
CREATE OR REPLACE FUNCTION public.auto_vincular_agendamento_venda()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  agendamento_record RECORD;
  aluno_record RECORD;
BEGIN
  -- Log de início
  RAISE LOG 'Iniciando vinculação automática para venda %', NEW.id;
  
  -- Buscar agendamento correspondente quando uma nova venda é criada
  IF TG_OP = 'INSERT' AND NEW.vendedor_id IS NOT NULL THEN
    -- Buscar dados do aluno da venda
    SELECT * INTO aluno_record
    FROM public.alunos 
    WHERE form_entry_id = NEW.id
    LIMIT 1;
    
    IF aluno_record IS NULL THEN
      RAISE LOG 'Nenhum aluno encontrado para a venda %', NEW.id;
      RETURN NEW;
    END IF;
    
    RAISE LOG 'Buscando agendamento para vendedor % com aluno % (%)', 
      NEW.vendedor_id, aluno_record.nome, aluno_record.email;
    
    -- Buscar agendamento por vendedor que ainda não tem venda vinculada
    SELECT a.* INTO agendamento_record
    FROM public.agendamentos a
    JOIN public.leads l ON l.id = a.lead_id
    WHERE a.vendedor_id = NEW.vendedor_id
    AND a.form_entry_id IS NULL
    AND a.resultado_reuniao = 'comprou'
    AND (
      -- Correspondência por email (mais confiável)
      (LOWER(TRIM(l.email)) = LOWER(TRIM(aluno_record.email)) AND l.email IS NOT NULL AND aluno_record.email IS NOT NULL)
      OR 
      -- Correspondência por nome (menos confiável)
      (LOWER(TRIM(l.nome)) = LOWER(TRIM(aluno_record.nome)) AND l.nome IS NOT NULL AND aluno_record.nome IS NOT NULL)
    )
    ORDER BY a.data_agendamento DESC
    LIMIT 1;

    IF agendamento_record IS NOT NULL THEN
      RAISE LOG 'Agendamento encontrado: % - vinculando à venda %', 
        agendamento_record.id, NEW.id;
        
      -- Vincular o agendamento à nova venda
      UPDATE public.agendamentos 
      SET 
        form_entry_id = NEW.id,
        updated_at = now()
      WHERE id = agendamento_record.id;
      
      -- Atualizar a venda com o SDR se não tiver e o agendamento tiver
      IF NEW.sdr_id IS NULL AND agendamento_record.sdr_id IS NOT NULL THEN
        RAISE LOG 'Atualizando SDR da venda % para %', NEW.id, agendamento_record.sdr_id;
        
        UPDATE public.form_entries
        SET 
          sdr_id = agendamento_record.sdr_id,
          atualizado_em = now()
        WHERE id = NEW.id;
        
        -- Atualizar NEW para refletir a mudança
        NEW.sdr_id := agendamento_record.sdr_id;
      END IF;
      
      RAISE LOG 'Vinculação automática concluída com sucesso: agendamento % → venda %', 
        agendamento_record.id, NEW.id;
    ELSE
      RAISE LOG 'Nenhum agendamento "comprou" encontrado para vincular à venda %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar a inserção
    RAISE LOG 'Erro na vinculação automática para venda %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Criar o trigger
CREATE TRIGGER auto_vincular_agendamento_venda_trigger
  AFTER INSERT ON public.form_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_vincular_agendamento_venda();

-- Melhorar também o trigger que atualiza SDR quando agendamento é vinculado
CREATE OR REPLACE FUNCTION public.update_form_entry_sdr_id_on_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Log de início
  RAISE LOG 'Verificando atualização de SDR para agendamento %', NEW.id;
  
  -- When a form_entry_id is added to an agendamento, update the form_entry with the sdr_id
  IF NEW.form_entry_id IS NOT NULL AND (OLD.form_entry_id IS NULL OR OLD.form_entry_id != NEW.form_entry_id) THEN
    RAISE LOG 'Atualizando SDR da venda % com SDR % do agendamento %', 
      NEW.form_entry_id, NEW.sdr_id, NEW.id;
      
    UPDATE public.form_entries 
    SET sdr_id = NEW.sdr_id,
        atualizado_em = now()
    WHERE id = NEW.form_entry_id 
    AND sdr_id IS NULL
    AND NEW.sdr_id IS NOT NULL;
    
    IF FOUND THEN
      RAISE LOG 'SDR atualizado com sucesso para venda %', NEW.form_entry_id;
    ELSE
      RAISE LOG 'SDR não foi atualizado (já existe ou é nulo) para venda %', NEW.form_entry_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falhar a atualização
    RAISE LOG 'Erro ao atualizar SDR do agendamento %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;