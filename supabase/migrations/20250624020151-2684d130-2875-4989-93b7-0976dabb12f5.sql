
-- Verificar se o bucket existe e torná-lo público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documentos-vendas';

-- Se o bucket não existir, criar como público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-vendas', 'documentos-vendas', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;

-- Criar políticas mais permissivas para bucket público
CREATE POLICY "Public access to documentos-vendas" ON storage.objects
FOR SELECT USING (bucket_id = 'documentos-vendas');

CREATE POLICY "Authenticated users can upload to documentos-vendas" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update documentos-vendas" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete from documentos-vendas" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);
