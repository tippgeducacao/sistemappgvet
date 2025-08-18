-- Criar tabelas para gerenciar grupos de supervisores e suas metas

-- Tabela para grupos de supervisores
CREATE TABLE IF NOT EXISTS public.grupos_supervisores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID NOT NULL,
  nome_grupo TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Tabela para membros dos grupos (SDRs)
CREATE TABLE IF NOT EXISTS public.membros_grupos_supervisores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID NOT NULL REFERENCES public.grupos_supervisores(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(grupo_id, usuario_id)
);

-- Tabela para metas mensais dos supervisores
CREATE TABLE IF NOT EXISTS public.metas_mensais_supervisores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID NOT NULL,
  grupo_id UUID REFERENCES public.grupos_supervisores(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  meta_vendas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(supervisor_id, grupo_id, ano, mes)
);

-- Habilitar RLS
ALTER TABLE public.grupos_supervisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros_grupos_supervisores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_mensais_supervisores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para grupos_supervisores
CREATE POLICY "Supervisores podem gerenciar seus grupos" 
ON public.grupos_supervisores 
FOR ALL 
USING (supervisor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Políticas RLS para membros_grupos_supervisores  
CREATE POLICY "Supervisores podem gerenciar membros de seus grupos"
ON public.membros_grupos_supervisores
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.grupos_supervisores gs 
  WHERE gs.id = grupo_id AND (
    gs.supervisor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('admin', 'diretor', 'secretaria'))
  )
));

-- Políticas RLS para metas_mensais_supervisores
CREATE POLICY "Supervisores podem gerenciar suas metas"
ON public.metas_mensais_supervisores  
FOR ALL
USING (supervisor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_grupos_supervisores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_metas_mensais_supervisores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grupos_supervisores_updated_at
  BEFORE UPDATE ON public.grupos_supervisores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grupos_supervisores_updated_at();

CREATE TRIGGER update_metas_mensais_supervisores_updated_at
  BEFORE UPDATE ON public.metas_mensais_supervisores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_metas_mensais_supervisores_updated_at();