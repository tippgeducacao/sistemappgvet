-- Criar tabela para armazenar agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sdr_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pos_graduacao_interesse TEXT NOT NULL,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para pós-graduações disponíveis
CREATE TABLE public.pos_graduacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir algumas pós-graduações de exemplo
INSERT INTO public.pos_graduacoes (nome) VALUES 
('Medicina Veterinária'),
('Odontologia'),
('Enfermagem'),
('Fisioterapia'),
('Nutrição'),
('Psicologia'),
('Farmácia'),
('Biomedicina');

-- Habilitar RLS nas tabelas
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_graduacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para agendamentos
CREATE POLICY "SDRs podem criar agendamentos" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('sdr_inbound', 'sdr_outbound')
  )
  AND sdr_id = auth.uid()
);

CREATE POLICY "SDRs podem ver seus agendamentos" 
ON public.agendamentos 
FOR SELECT 
USING (
  sdr_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

CREATE POLICY "Vendedores podem ver agendamentos com eles" 
ON public.agendamentos 
FOR SELECT 
USING (
  vendedor_id = auth.uid()
  OR sdr_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria', 'diretor')
  )
);

CREATE POLICY "SDRs podem atualizar seus agendamentos" 
ON public.agendamentos 
FOR UPDATE 
USING (sdr_id = auth.uid())
WITH CHECK (sdr_id = auth.uid());

-- Políticas para pós-graduações
CREATE POLICY "Todos usuários autenticados podem ver pós-graduações" 
ON public.pos_graduacoes 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem gerenciar pós-graduações" 
ON public.pos_graduacoes 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_agendamentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_agendamentos_updated_at();