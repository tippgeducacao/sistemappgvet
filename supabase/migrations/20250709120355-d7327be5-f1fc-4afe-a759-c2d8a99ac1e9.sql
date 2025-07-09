-- Criar bucket para fotos dos vendedores
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendedor-photos', 'vendedor-photos', true);

-- Criar políticas para o bucket vendedor-photos
-- Permitir que todos vejam as fotos (public)
CREATE POLICY "Fotos de vendedores são publicamente visíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendedor-photos');

-- Permitir que usuários autenticados façam upload de fotos
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de vendedores" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vendedor-photos' AND auth.role() = 'authenticated');

-- Permitir que usuários autenticados atualizem fotos de vendedores
CREATE POLICY "Usuários autenticados podem atualizar fotos de vendedores" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vendedor-photos' AND auth.role() = 'authenticated');

-- Permitir que usuários autenticados removam fotos de vendedores
CREATE POLICY "Usuários autenticados podem remover fotos de vendedores" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vendedor-photos' AND auth.role() = 'authenticated');