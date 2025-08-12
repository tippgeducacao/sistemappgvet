-- Adicionar novos tipos de usuário
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordenador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';

-- Criar tabela de grupos de supervisores
CREATE TABLE IF NOT EXISTS public.grupos_supervisores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome_grupo text NOT NULL,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Criar tabela de membros dos grupos
CREATE TABLE IF NOT EXISTS public.membros_grupos_supervisores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id uuid NOT NULL REFERENCES public.grupos_supervisores(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(grupo_id, usuario_id)
);

-- Criar tabela de metas mensais para supervisores/coordenadores
CREATE TABLE IF NOT EXISTS public.metas_mensais_supervisores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  grupo_id uuid REFERENCES public.grupos_supervisores(id) ON DELETE CASCADE,
  ano integer NOT NULL,
  mes integer NOT NULL,
  meta_vendas integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(supervisor_id, ano, mes)
);

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
  FOR EACH ROW EXECUTE FUNCTION public.update_grupos_supervisores_updated_at();

CREATE TRIGGER update_metas_mensais_supervisores_updated_at
  BEFORE UPDATE ON public.metas_mensais_supervisores
  FOR EACH ROW EXECUTE FUNCTION public.update_metas_mensais_supervisores_updated_at();

-- Políticas RLS para grupos_supervisores
ALTER TABLE public.grupos_supervisores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisores podem gerenciar seus grupos"
ON public.grupos_supervisores
FOR ALL
USING (supervisor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'coordenador')
));

-- Políticas RLS para membros_grupos_supervisores
ALTER TABLE public.membros_grupos_supervisores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisores podem gerenciar membros de seus grupos"
ON public.membros_grupos_supervisores
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.grupos_supervisores gs
  WHERE gs.id = grupo_id 
  AND (gs.supervisor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'coordenador')
  ))
));

-- Políticas RLS para metas_mensais_supervisores
ALTER TABLE public.metas_mensais_supervisores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisores podem gerenciar suas metas"
ON public.metas_mensais_supervisores
FOR ALL
USING (supervisor_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type IN ('admin', 'diretor', 'coordenador')
));

-- Adicionar novos níveis para coordenador e supervisor
INSERT INTO public.niveis_vendedores (nivel, tipo_usuario, meta_semanal_vendedor, meta_vendas_cursos, fixo_mensal, variavel_semanal, vale)
VALUES 
  ('junior', 'coordenador', 0, 0, 3000, 0, 400),
  ('pleno', 'coordenador', 0, 0, 4000, 0, 500),
  ('senior', 'coordenador', 0, 0, 5000, 0, 600),
  ('junior', 'supervisor', 0, 0, 2500, 0, 350),
  ('pleno', 'supervisor', 0, 0, 3500, 0, 450),
  ('senior', 'supervisor', 0, 0, 4500, 0, 550)
ON CONFLICT (nivel, tipo_usuario) DO NOTHING;