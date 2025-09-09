-- Add sdr_id column to form_entries
ALTER TABLE public.form_entries 
ADD COLUMN sdr_id uuid REFERENCES public.profiles(id);

-- Create index for better performance
CREATE INDEX idx_form_entries_sdr_id ON public.form_entries(sdr_id);

-- Backfill sdr_id from agendamentos where form_entry_id matches
UPDATE public.form_entries fe
SET sdr_id = a.sdr_id
FROM public.agendamentos a
WHERE a.form_entry_id = fe.id
  AND fe.sdr_id IS NULL;