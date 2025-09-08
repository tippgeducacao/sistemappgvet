-- Criar tabela para cache de comissionamentos semanais
CREATE TABLE public.comissionamentos_semanais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('vendedor', 'sdr', 'supervisor')),
    ano INTEGER NOT NULL,
    semana INTEGER NOT NULL,
    pontos NUMERIC NOT NULL DEFAULT 0,
    meta NUMERIC NOT NULL DEFAULT 0,
    percentual NUMERIC NOT NULL DEFAULT 0,
    multiplicador NUMERIC NOT NULL DEFAULT 0,
    variavel NUMERIC NOT NULL DEFAULT 0,
    valor NUMERIC NOT NULL DEFAULT 0,
    regra_id UUID,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, user_type, ano, semana)
);

-- Habilitar RLS
ALTER TABLE public.comissionamentos_semanais ENABLE ROW LEVEL SECURITY;

-- Policies para SELECT
CREATE POLICY "Usuários podem ver seus próprios comissionamentos"
ON public.comissionamentos_semanais
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Gestão pode ver todos os comissionamentos"
ON public.comissionamentos_semanais
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Policies para INSERT/UPDATE (apenas gestão ou service role)
CREATE POLICY "Gestão pode inserir comissionamentos"
ON public.comissionamentos_semanais
FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
));

CREATE POLICY "Gestão pode atualizar comissionamentos"
ON public.comissionamentos_semanais
FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_comissionamentos_semanais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_comissionamentos_semanais_updated_at
BEFORE UPDATE ON public.comissionamentos_semanais
FOR EACH ROW
EXECUTE FUNCTION public.update_comissionamentos_semanais_updated_at();

-- Índices para performance
CREATE INDEX idx_comissionamentos_semanais_user_period 
ON public.comissionamentos_semanais (user_id, ano, semana);

CREATE INDEX idx_comissionamentos_semanais_period 
ON public.comissionamentos_semanais (ano, semana);

CREATE INDEX idx_comissionamentos_semanais_user_type 
ON public.comissionamentos_semanais (user_type);