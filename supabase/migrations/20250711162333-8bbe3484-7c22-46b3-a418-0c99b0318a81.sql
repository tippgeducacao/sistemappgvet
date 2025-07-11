-- Criar tabela para metas dos vendedores
CREATE TABLE public.metas_vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  meta_vendas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(vendedor_id, ano, mes)
);

-- Enable RLS
ALTER TABLE public.metas_vendedores ENABLE ROW LEVEL SECURITY;

-- Política para admin e diretor poderem ver todas as metas
CREATE POLICY "Admin e diretor podem ver todas as metas" 
ON public.metas_vendedores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  ) OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'diretor')
  )
);

-- Política para admin e diretor poderem criar metas
CREATE POLICY "Admin e diretor podem criar metas" 
ON public.metas_vendedores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  ) OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'diretor')
  )
);

-- Política para admin e diretor poderem atualizar metas
CREATE POLICY "Admin e diretor podem atualizar metas" 
ON public.metas_vendedores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  ) OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'diretor')
  )
);

-- Política para vendedores poderem ver suas próprias metas
CREATE POLICY "Vendedores podem ver suas metas" 
ON public.metas_vendedores 
FOR SELECT 
USING (
  vendedor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  ) OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'diretor', 'secretaria')
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_metas_vendedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metas_vendedores_updated_at
  BEFORE UPDATE ON public.metas_vendedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_metas_vendedores_updated_at();