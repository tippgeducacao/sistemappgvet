-- Criar tabela para metas semanais dos vendedores
CREATE TABLE public.metas_semanais_vendedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL,
    ano INTEGER NOT NULL,
    semana INTEGER NOT NULL, -- Semana do ano (1-53)
    meta_vendas INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    UNIQUE(vendedor_id, ano, semana)
);

-- Habilitar RLS
ALTER TABLE public.metas_semanais_vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para metas semanais
CREATE POLICY "Admin e diretor podem criar metas semanais" 
ON public.metas_semanais_vendedores 
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

CREATE POLICY "Admin e diretor podem atualizar metas semanais" 
ON public.metas_semanais_vendedores 
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

CREATE POLICY "Admin e diretor podem ver todas as metas semanais" 
ON public.metas_semanais_vendedores 
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

CREATE POLICY "Vendedores podem ver suas metas semanais" 
ON public.metas_semanais_vendedores 
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

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_metas_semanais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metas_semanais_vendedores_updated_at
    BEFORE UPDATE ON public.metas_semanais_vendedores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_metas_semanais_updated_at();