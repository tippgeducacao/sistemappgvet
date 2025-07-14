-- Adicionar campo 'ativo' na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_profiles_ativo ON public.profiles(ativo);

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.ativo IS 'Define se o usuário está ativo no sistema. Usuários inativos mantêm histórico mas não aparecem em rankings e não podem acessar o sistema';