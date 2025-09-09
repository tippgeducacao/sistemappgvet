-- Create trigger to automatically populate sdr_id in form_entries
CREATE OR REPLACE FUNCTION public.update_form_entry_sdr_id_on_agendamento()
RETURNS TRIGGER AS $$
BEGIN
  -- When a form_entry_id is added to an agendamento, update the form_entry with the sdr_id
  IF NEW.form_entry_id IS NOT NULL AND (OLD.form_entry_id IS NULL OR OLD.form_entry_id != NEW.form_entry_id) THEN
    UPDATE public.form_entries 
    SET sdr_id = NEW.sdr_id,
        atualizado_em = now()
    WHERE id = NEW.form_entry_id AND sdr_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER trigger_update_form_entry_sdr_id_insert
  AFTER INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_entry_sdr_id_on_agendamento();

CREATE TRIGGER trigger_update_form_entry_sdr_id_update
  AFTER UPDATE OF form_entry_id ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_entry_sdr_id_on_agendamento();

-- Backfill existing form_entries with sdr_id from agendamentos
UPDATE public.form_entries
SET sdr_id = agendamentos.sdr_id,
    atualizado_em = now()
FROM public.agendamentos
WHERE agendamentos.form_entry_id = form_entries.id
  AND form_entries.sdr_id IS NULL
  AND agendamentos.sdr_id IS NOT NULL;