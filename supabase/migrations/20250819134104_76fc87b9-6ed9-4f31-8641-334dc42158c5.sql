-- Permitir que supervisores vejam fotos dos membros do seu grupo
CREATE POLICY "Supervisores podem ver fotos dos SDRs do grupo" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'vendedor-photos' AND 
  EXISTS (
    SELECT 1 
    FROM public.grupos_supervisores gs
    JOIN public.membros_grupos mg ON gs.id = mg.grupo_id
    JOIN public.profiles p ON mg.usuario_id = p.id
    WHERE (storage.foldername(name))[1] = p.id::text
    AND gs.supervisor_id = auth.uid()
  )
);

-- Permitir que administradores, diretores e secretárias vejam todas as fotos
CREATE POLICY "Admins podem ver todas as fotos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'vendedor-photos' AND 
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);