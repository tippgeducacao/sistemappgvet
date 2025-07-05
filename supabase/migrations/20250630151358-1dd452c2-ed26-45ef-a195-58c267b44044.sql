
-- Adicionar campo sprinthub_id na tabela leads para controle de duplicatas
ALTER TABLE public.leads 
ADD COLUMN sprinthub_id TEXT;

-- Criar índice para performance nas consultas de duplicatas
CREATE INDEX idx_leads_sprinthub_id ON public.leads(sprinthub_id);

-- Adicionar campo fonte_captura para distinguir origem dos leads
ALTER TABLE public.leads 
ADD COLUMN fonte_captura TEXT DEFAULT 'GreatPages';

-- Criar índice para filtros por fonte
CREATE INDEX idx_leads_fonte_captura ON public.leads(fonte_captura);
