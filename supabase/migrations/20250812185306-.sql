-- Criar tabela para relatórios diários dos vendedores
CREATE TABLE public.relatorios_diarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL,
  data DATE NOT NULL,
  reunioes_realizadas INTEGER NOT NULL DEFAULT 0,
  vendas_fechadas INTEGER NOT NULL DEFAULT 0,
  taxa_fechamento DECIMAL(5,2) NOT NULL DEFAULT 0,
  principais_objecoes TEXT,
  acoes_proximo_dia TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendedor_id, data)
);

-- Enable Row Level Security
ALTER TABLE public.relatorios_diarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para relatórios diários
CREATE POLICY "Vendedores podem criar seus relatórios" 
ON public.relatorios_diarios 
FOR INSERT 
WITH CHECK (
  vendedor_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('vendedor', 'sdr')
  )
);

CREATE POLICY "Vendedores podem ver seus relatórios" 
ON public.relatorios_diarios 
FOR SELECT 
USING (
  vendedor_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

CREATE POLICY "Vendedores podem atualizar seus relatórios" 
ON public.relatorios_diarios 
FOR UPDATE 
USING (vendedor_id = auth.uid())
WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "Admins podem ver todos os relatórios" 
ON public.relatorios_diarios 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_relatorios_diarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relatorios_diarios_updated_at
BEFORE UPDATE ON public.relatorios_diarios
FOR EACH ROW
EXECUTE FUNCTION public.update_relatorios_diarios_updated_at();