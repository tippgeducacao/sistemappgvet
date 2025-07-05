
-- Criar tabela para armazenar os cursos disponíveis
CREATE TABLE public.cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  criado_por UUID REFERENCES public.users(id)
);

-- Inserir os cursos existentes
INSERT INTO public.cursos (nome) VALUES
('Pós-graduação: Comportamento e Bem Estar Animal – T1 (companhia)'),
('Pós-graduação: Comportamento e Bem Estar Animal – T1 (produção)'),
('Pós-graduação: SANIDADE AVÍCOLA – T5 #01'),
('Pós-graduação: PRODUÇÃO AVÍCOLA – T5 #01'),
('Pós-graduação: CLÍNICA MÉDICA DE BOVINOS – T3 #01'),
('Pós-graduação: REPRODUÇÃO, NUTRIÇÃO E GESTÃO DE BOVINOS – T7 #01'),
('Pós-graduação: PRODUÇÃO, NUTRIÇÃO E GESTÃO DE BOVINOS – T7 #01'),
('Pós-graduação: COOPERATIVISMO E CRÉDITO RURAL – T4 #01'),
('Pós-graduação: QUALIDADE E SEGURANÇA DE ALIMENTOS DE ORIGEM ANIMAL – T1 #01'),
('Pós-graduação: QUALIDADE E SEGURANÇA DE ALIMENTOS DE ORIGEM ANIMAL – T1 #02'),
('Pós-graduação: CLÍNICA MÉDICA E CIRÚRGICA DE BOVINOS – T1 #01'),
('Curso: CATTLE CLINIC'),
('Curso: INDICADORES ZOOTÉCNICOS E DA REPRODUÇÃO'),
('Pós-graduação: PRODUÇÃO DE SUÍNOS – T2 #01'),
('Pós-graduação: NUTRIÇÃO E GESTÃO DE BOVINOS – T1'),
('Pós-graduação: SAÚDE ÚNICA E ZOONOSES – T1'),
('Pós-graduação: SANIDADE AVÍCOLA – T5 #02'),
('Pós-graduação: PRODUÇÃO AVÍCOLA – T5 #02'),
('Pós-graduação: CLÍNICA MÉDICA DE BOVINOS – T3 #02'),
('Pós-graduação: REPRODUÇÃO, NUTRIÇÃO E GESTÃO DE BOVINOS – T7 #02'),
('Pós-graduação: COOPERATIVISMO E CRÉDITO RURAL – T4 #02'),
('Pós-graduação: PRODUÇÃO DE SUÍNOS – T2 #02'),
('Pós-graduação: Reprodução de Bovinos – T1'),
('CURSO NUTRIÇÃO E FORMULAÇÃO NASEM 2021 – 01/25 (VERÊ)'),
('MBA em postura comercial'),
('Curso de Parceiros'),
('Curso Aprimoramento'),
('Outro');

-- Habilitar RLS para a tabela de cursos
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam cursos ativos
CREATE POLICY "Todos podem ver cursos ativos" 
  ON public.cursos 
  FOR SELECT 
  USING (ativo = true);

-- Política para permitir que secretárias gerenciem cursos
CREATE POLICY "Secretárias podem gerenciar cursos" 
  ON public.cursos 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'secretaria'
    )
  );

-- Adicionar coluna curso_id na tabela form_entries
ALTER TABLE public.form_entries 
ADD COLUMN curso_id UUID REFERENCES public.cursos(id);
