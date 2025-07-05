
-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'secretaria', 'vendedor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  fonte_referencia TEXT DEFAULT 'GreatPages',
  dispositivo TEXT,
  regiao TEXT,
  pagina_id TEXT,
  pagina_nome TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  ip_address TEXT,
  user_agent TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead interactions table
CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scoring rules table
CREATE TABLE public.regras_pontuacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_nome TEXT NOT NULL,
  opcao_valor TEXT NOT NULL,
  pontos INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form entries table
CREATE TABLE public.form_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES public.profiles(id),
  curso_id UUID REFERENCES public.cursos(id),
  aluno_id UUID,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'matriculado', 'desistiu')),
  pontuacao_esperada INTEGER,
  pontuacao_validada INTEGER,
  motivo_pendencia TEXT,
  documento_comprobatorio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form responses table
CREATE TABLE public.respostas_formulario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_entry_id UUID REFERENCES public.form_entries(id) ON DELETE CASCADE,
  campo_nome TEXT NOT NULL,
  valor_informado TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alunos table
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  crmv TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link alunos to form entries
ALTER TABLE public.form_entries 
ADD CONSTRAINT fk_form_entries_aluno 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos-vendas', 'documentos-vendas', false);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_pontuacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formulario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for cursos (courses)
CREATE POLICY "All authenticated users can view active courses" ON public.cursos
  FOR SELECT USING (auth.role() = 'authenticated' AND ativo = true);

CREATE POLICY "Admins can manage courses" ON public.cursos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'secretaria')
    )
  );

-- Create RLS policies for leads
CREATE POLICY "Authenticated users can view leads" ON public.leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage leads" ON public.leads
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for lead interactions
CREATE POLICY "Users can view lead interactions" ON public.lead_interactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create lead interactions" ON public.lead_interactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for scoring rules
CREATE POLICY "All authenticated users can view scoring rules" ON public.regras_pontuacao
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage scoring rules" ON public.regras_pontuacao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'secretaria')
    )
  );

-- Create RLS policies for form entries
CREATE POLICY "Users can view their own form entries" ON public.form_entries
  FOR SELECT USING (
    vendedor_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'secretaria')
    )
  );

CREATE POLICY "Vendedores can create form entries" ON public.form_entries
  FOR INSERT WITH CHECK (
    vendedor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'vendedor'
    )
  );

CREATE POLICY "Admins and secretaria can update form entries" ON public.form_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type IN ('admin', 'secretaria')
    )
  );

-- Create RLS policies for form responses
CREATE POLICY "Users can view form responses for their entries" ON public.respostas_formulario
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.form_entries 
      WHERE id = form_entry_id AND (
        vendedor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND user_type IN ('admin', 'secretaria')
        )
      )
    )
  );

CREATE POLICY "Users can create form responses" ON public.respostas_formulario
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.form_entries 
      WHERE id = form_entry_id AND vendedor_id = auth.uid()
    )
  );

-- Create RLS policies for alunos
CREATE POLICY "Users can view alunos" ON public.alunos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create alunos" ON public.alunos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create storage policies for documents
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos-vendas' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos-vendas' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos-vendas' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos-vendas' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create helper functions for document management
CREATE OR REPLACE FUNCTION public.find_document_by_venda_id(venda_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  document_path TEXT;
BEGIN
  SELECT documento_comprobatorio INTO document_path
  FROM public.form_entries
  WHERE id = venda_id_param;
  
  RETURN document_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.list_bucket_files(bucket_name TEXT, folder_prefix TEXT DEFAULT '')
RETURNS TABLE(name TEXT, id UUID, updated_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE, last_accessed_at TIMESTAMP WITH TIME ZONE, metadata JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata
  FROM storage.objects o
  WHERE o.bucket_id = bucket_name
  AND (folder_prefix = '' OR o.name LIKE folder_prefix || '%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.find_document_in_bucket(search_pattern TEXT)
RETURNS TEXT AS $$
DECLARE
  document_path TEXT;
BEGIN
  SELECT name INTO document_path
  FROM storage.objects
  WHERE bucket_id = 'documentos-vendas'
  AND name LIKE '%' || search_pattern || '%'
  LIMIT 1;
  
  RETURN document_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
