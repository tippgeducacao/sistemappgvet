
-- Criar bucket para armazenar fotos dos vendedores
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendedor-photos', 'vendedor-photos', true);

-- Criar política para permitir que admins e secretárias façam upload de fotos
CREATE POLICY "Admins and secretarias can upload vendedor photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendedor-photos' AND 
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'secretaria'::app_role)
  )
);

-- Criar política para permitir que todos vejam as fotos dos vendedores
CREATE POLICY "Everyone can view vendedor photos" ON storage.objects
FOR SELECT USING (bucket_id = 'vendedor-photos');

-- Criar política para permitir que admins e secretárias atualizem fotos
CREATE POLICY "Admins and secretarias can update vendedor photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendedor-photos' AND 
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'secretaria'::app_role)
  )
);

-- Criar política para permitir que admins e secretárias deletem fotos
CREATE POLICY "Admins and secretarias can delete vendedor photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendedor-photos' AND 
  (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'secretaria'::app_role)
  )
);

-- Adicionar coluna para foto do vendedor na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN photo_url TEXT;
