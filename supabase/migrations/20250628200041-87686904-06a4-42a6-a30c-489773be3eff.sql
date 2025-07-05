
-- Criar tabela de leads completamente isolada do sistema atual
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    fonte_referencia TEXT, -- De onde veio (Google, Facebook, etc.)
    dispositivo TEXT, -- Mobile, Desktop, etc.
    regiao TEXT, -- Localização geográfica
    pagina_id TEXT, -- ID da página de captura
    pagina_nome TEXT, -- Nome/título da página
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    ip_address TEXT,
    user_agent TEXT,
    data_captura TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'novo', -- novo, contatado, qualificado, convertido, perdido
    vendedor_atribuido UUID REFERENCES public.profiles(id),
    observacoes TEXT,
    convertido_em_venda BOOLEAN DEFAULT false,
    venda_id UUID, -- Referência à venda gerada (se houver)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para histórico de interações com os leads
CREATE TABLE public.lead_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    tipo TEXT NOT NULL, -- contato_telefonico, whatsapp, email, reuniao, etc.
    descricao TEXT,
    resultado TEXT, -- interessado, nao_interessado, reagendar, etc.
    proxima_acao TEXT,
    data_proxima_acao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas para admin específico por enquanto
CREATE POLICY "Admin específico pode ver todos os leads" 
    ON public.leads 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email = 'wallasmonteiro019@gmail.com'
        )
    );

CREATE POLICY "Admin específico pode gerenciar interações" 
    ON public.lead_interactions 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND email = 'wallasmonteiro019@gmail.com'
        )
    );

-- Índices para performance
CREATE INDEX idx_leads_data_captura ON public.leads(data_captura DESC);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_vendedor ON public.leads(vendedor_atribuido);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
