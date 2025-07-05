
-- Add photo_url column to profiles table for vendedor photos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add enviado_em column to form_entries table (using created_at as default)
ALTER TABLE public.form_entries 
ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMP WITH TIME ZONE DEFAULT created_at;
