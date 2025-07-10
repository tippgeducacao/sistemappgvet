-- Tornar o bucket documentos-vendas público para facilitar o acesso
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documentos-vendas';

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can download documents" ON storage.objects;

-- Criar políticas mais permissivas para documentos
CREATE POLICY "Anyone can view documents in documentos-vendas"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos-vendas');

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');