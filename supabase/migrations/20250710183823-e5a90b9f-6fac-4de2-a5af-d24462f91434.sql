-- Verificar se o bucket documentos-vendas existe e criar se necessário
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos-vendas', 'documentos-vendas', false, 52428800, '{"image/*","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}')
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket documentos-vendas se não existirem
DO $$
BEGIN
  -- Política para visualizar documentos (usuários autenticados)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view documents'
  ) THEN
    CREATE POLICY "Users can view documents"
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');
  END IF;

  -- Política para upload de documentos (usuários autenticados)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload documents'
  ) THEN
    CREATE POLICY "Users can upload documents"
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');
  END IF;

  -- Política para download de documentos (usuários autenticados)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can download documents'
  ) THEN
    CREATE POLICY "Users can download documents"
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');
  END IF;
END $$;