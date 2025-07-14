-- Adicionar campo 'nivel' na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN nivel TEXT DEFAULT 'junior' CHECK (nivel IN ('junior', 'pleno', 'senior'));

-- Criar tabela para configuração de níveis/ranks
CREATE TABLE public.niveis_vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nivel TEXT NOT NULL UNIQUE CHECK (nivel IN ('junior', 'pleno', 'senior')),
  fixo_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  vale DECIMAL(10,2) NOT NULL DEFAULT 0,
  variavel_semanal DECIMAL(10,2) NOT NULL DEFAULT 0,
  meta_semanal_pontos INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.niveis_vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas para niveis_vendedores
CREATE POLICY "Todos podem visualizar níveis" 
ON public.niveis_vendedores 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Apenas diretores podem gerenciar níveis" 
ON public.niveis_vendedores 
FOR ALL 
USING (EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'diretor'::app_role))
WITH CHECK (EXISTS ( SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'diretor'::app_role));

-- Inserir dados padrão baseados na imagem
INSERT INTO public.niveis_vendedores (nivel, fixo_mensal, vale, variavel_semanal, meta_semanal_pontos) VALUES
('junior', 2200, 400, 450, 6),
('pleno', 2600, 400, 500, 7),
('senior', 3000, 400, 550, 8);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_niveis_vendedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_niveis_vendedores_updated_at
BEFORE UPDATE ON public.niveis_vendedores
FOR EACH ROW
EXECUTE FUNCTION public.update_niveis_vendedores_updated_at();

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.nivel IS 'Nível do vendedor: junior, pleno ou senior';
COMMENT ON TABLE public.niveis_vendedores IS 'Configuração de níveis e metas dos vendedores';
COMMENT ON COLUMN public.niveis_vendedores.fixo_mensal IS 'Salário fixo mensal em reais';
COMMENT ON COLUMN public.niveis_vendedores.vale IS 'Vale mensal em reais';
COMMENT ON COLUMN public.niveis_vendedores.variavel_semanal IS 'Variável semanal em reais';
COMMENT ON COLUMN public.niveis_vendedores.meta_semanal_pontos IS 'Meta semanal em pontos/vendas';