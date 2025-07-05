
-- Adicionar coluna para data de envio na tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Adicionar coluna para foto do vendedor na tabela profiles (se não existir)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Criar enum para status do form_entries se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_status') THEN
    CREATE TYPE form_status AS ENUM ('pendente', 'matriculado', 'desistiu');
  END IF;
END$$;

-- Alterar a coluna status para usar o enum
ALTER TABLE public.form_entries 
ALTER COLUMN status TYPE form_status USING status::form_status;

-- Adicionar constraint de check para o status se não existir
ALTER TABLE public.form_entries 
DROP CONSTRAINT IF EXISTS form_entries_status_check;

-- Criar bucket para fotos dos vendedores se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendedor-photos', 'vendedor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de fotos dos vendedores
DROP POLICY IF EXISTS "Everyone can view vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vendedor photos" ON storage.objects;

CREATE POLICY "Everyone can view vendedor photos" ON storage.objects
FOR SELECT USING (bucket_id = 'vendedor-photos');

CREATE POLICY "Authenticated users can upload vendedor photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update vendedor photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete vendedor photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);

-- Adicionar role de vendedor para ppgvendedor@ppgvendedor.com
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'vendedor'::app_role,
    au.id
FROM auth.users au 
WHERE au.email = 'ppgvendedor@ppgvendedor.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar o perfil para vendedor se existir
UPDATE public.profiles 
SET user_type = 'vendedor'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'ppgvendedor@ppgvendedor.com'
);
