
-- Criar bucket para armazenar fotos dos vendedores (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendedor-photos', 'vendedor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver para recriar
DROP POLICY IF EXISTS "Everyone can view vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vendedor photos" ON storage.objects; 
DROP POLICY IF EXISTS "Authenticated users can delete vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and secretarias can upload vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and secretarias can update vendedor photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and secretarias can delete vendedor photos" ON storage.objects;

-- Criar política para permitir que todos vejam as fotos dos vendedores
CREATE POLICY "Everyone can view vendedor photos" ON storage.objects
FOR SELECT USING (bucket_id = 'vendedor-photos');

-- Criar política para permitir que usuários autenticados façam upload de fotos
CREATE POLICY "Authenticated users can upload vendedor photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir que usuários autenticados atualizem fotos
CREATE POLICY "Authenticated users can update vendedor photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir que usuários autenticados deletem fotos
CREATE POLICY "Authenticated users can delete vendedor photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);
