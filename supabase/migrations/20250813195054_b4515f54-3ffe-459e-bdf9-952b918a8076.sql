-- Criar tabela para eventos especiais do diretor
CREATE TABLE public.eventos_especiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eventos_especiais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Diretores podem gerenciar eventos especiais"
ON public.eventos_especiais
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND user_type = 'diretor'
  )
);

CREATE POLICY "Usuários autenticados podem visualizar eventos especiais"
ON public.eventos_especiais
FOR SELECT
USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_eventos_especiais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_eventos_especiais_updated_at
  BEFORE UPDATE ON public.eventos_especiais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_eventos_especiais_updated_at();

-- Função para verificar conflitos com eventos especiais
CREATE OR REPLACE FUNCTION public.verificar_conflito_evento_especial(
  data_inicio_agendamento TIMESTAMP WITH TIME ZONE,
  data_fim_agendamento TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.eventos_especiais
    WHERE (
      (data_inicio_agendamento >= data_inicio AND data_inicio_agendamento < data_fim) OR
      (data_fim_agendamento > data_inicio AND data_fim_agendamento <= data_fim) OR
      (data_inicio_agendamento <= data_inicio AND data_fim_agendamento >= data_fim)
    )
  );
END;
$$;