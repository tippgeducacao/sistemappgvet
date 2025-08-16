-- Criar tabela de indicações com os campos corretos do formulário
CREATE TABLE public.indicacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cadastrado_por TEXT NOT NULL,
  nome_aluno TEXT NOT NULL,
  whatsapp_aluno TEXT NOT NULL,
  nome_indicado TEXT NOT NULL,
  whatsapp_indicado TEXT NOT NULL,
  formacao TEXT,
  area_interesse TEXT,
  observacoes TEXT,
  vendedor_atribuido UUID,
  status TEXT NOT NULL DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins, diretores e secretarias podem ver todas as indicações"
ON public.indicacoes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

CREATE POLICY "Admins, diretores e secretarias podem inserir indicações"
ON public.indicacoes
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

CREATE POLICY "Admins, diretores e secretarias podem atualizar indicações"
ON public.indicacoes
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'secretaria')
));

CREATE POLICY "Vendedores podem ver suas indicações atribuídas"
ON public.indicacoes
FOR SELECT
USING (vendedor_atribuido = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_indicacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_indicacoes_updated_at
  BEFORE UPDATE ON public.indicacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_indicacoes_updated_at();