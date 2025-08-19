-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Supervisores podem ver fotos dos SDRs do grupo" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem ver todas as fotos" ON storage.objects;

-- Criar política mais simples para teste - supervisores podem ver todas as fotos do bucket
CREATE POLICY "Usuarios autenticados podem ver fotos"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'vendedor-photos' AND 
  auth.role() = 'authenticated'
);