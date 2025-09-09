-- Create trigger to automatically populate sdr_id in form_entries when agendamento is linked
CREATE OR REPLACE FUNCTION public.update_form_entry_sdr_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- When a form_entry_id is added to an agendamento, update the form_entry with the sdr_id
  IF NEW.form_entry_id IS NOT NULL AND OLD.form_entry_id IS NULL THEN
    UPDATE public.form_entries 
    SET sdr_id = NEW.sdr_id,
        atualizado_em = now()
    WHERE id = NEW.form_entry_id AND sdr_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on agendamentos table
CREATE TRIGGER update_form_entry_sdr_trigger
  AFTER UPDATE ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_form_entry_sdr_id();