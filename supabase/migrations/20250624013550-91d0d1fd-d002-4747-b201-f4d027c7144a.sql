
-- Primeiro, vamos garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-vendas', 'documentos-vendas', false)
ON CONFLICT (id) DO NOTHING;

-- Remover todas as políticas antigas para recriar
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Criar políticas mais permissivas para garantir que funcionem
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);
