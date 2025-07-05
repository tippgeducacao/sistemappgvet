
-- Criar bucket para documentos de vendas se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-vendas', 'documentos-vendas', false)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver para recriar
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;

-- Criar política para permitir que usuários autenticados façam upload de documentos
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir que usuários autenticados vejam documentos
CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);

-- Criar política para permitir que usuários autenticados deletem documentos
CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documentos-vendas' AND 
  auth.role() = 'authenticated'
);
