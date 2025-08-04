-- Criar tabela para grupos de pós-graduações
CREATE TABLE public.grupos_pos_graduacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar tabela de relacionamento entre grupos e cursos de pós-graduação
CREATE TABLE public.grupos_pos_graduacoes_cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID NOT NULL REFERENCES public.grupos_pos_graduacoes(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, curso_id)
);

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_grupos_pos_graduacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_grupos_pos_graduacoes_updated_at
  BEFORE UPDATE ON public.grupos_pos_graduacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_grupos_pos_graduacoes_updated_at();

-- RLS policies para grupos_pos_graduacoes
ALTER TABLE public.grupos_pos_graduacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e diretores podem gerenciar grupos de pós-graduações"
ON public.grupos_pos_graduacoes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);

CREATE POLICY "Usuários autenticados podem visualizar grupos ativos"
ON public.grupos_pos_graduacoes
FOR SELECT
USING (auth.role() = 'authenticated' AND ativo = true);

-- RLS policies para grupos_pos_graduacoes_cursos
ALTER TABLE public.grupos_pos_graduacoes_cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e diretores podem gerenciar relações grupo-curso"
ON public.grupos_pos_graduacoes_cursos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);

CREATE POLICY "Usuários autenticados podem visualizar relações grupo-curso"
ON public.grupos_pos_graduacoes_cursos
FOR SELECT
USING (auth.role() = 'authenticated');