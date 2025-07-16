-- Criar tabela para regras de comissionamento
CREATE TABLE public.regras_comissionamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_usuario TEXT NOT NULL DEFAULT 'vendedor',
  percentual_minimo DECIMAL(5,2) NOT NULL,
  percentual_maximo DECIMAL(5,2) NOT NULL,
  multiplicador DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Inserir dados iniciais para vendedores
INSERT INTO public.regras_comissionamento (tipo_usuario, percentual_minimo, percentual_maximo, multiplicador) VALUES
('vendedor', 0, 50, 0),
('vendedor', 51, 69, 0.3),
('vendedor', 70, 84, 0.5),
('vendedor', 85, 99, 0.7),
('vendedor', 100, 119, 1),
('vendedor', 120, 150, 1.2),
('vendedor', 151, 200, 1.8),
('vendedor', 201, 999, 2);

-- Habilitar RLS
ALTER TABLE public.regras_comissionamento ENABLE ROW LEVEL SECURITY;

-- Política para visualização (todos usuários autenticados)
CREATE POLICY "Usuários autenticados podem visualizar regras de comissionamento" 
ON public.regras_comissionamento 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política para gerenciamento (apenas admins e diretores)
CREATE POLICY "Admins e diretores podem gerenciar regras de comissionamento" 
ON public.regras_comissionamento 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor')
));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_regras_comissionamento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regras_comissionamento_updated_at
  BEFORE UPDATE ON public.regras_comissionamento
  FOR EACH ROW
  EXECUTE FUNCTION update_regras_comissionamento_updated_at();