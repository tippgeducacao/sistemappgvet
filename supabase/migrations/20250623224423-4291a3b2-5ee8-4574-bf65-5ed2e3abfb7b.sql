
-- Adicionar coluna para documento comprobatório na tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN documento_comprobatorio TEXT;

-- Criar bucket de storage para documentos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-vendas', 'documentos-vendas', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket (permitir upload para usuários autenticados)
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their documents" ON storage.objects
FOR DELETE USING (bucket_id = 'documentos-vendas' AND auth.role() = 'authenticated');
