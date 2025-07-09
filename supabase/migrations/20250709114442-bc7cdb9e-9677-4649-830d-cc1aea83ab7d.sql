-- 1. Criar o enum app_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'secretaria', 'vendedor', 'diretor');
    END IF;
END $$;

-- 2. Se o enum já existir, adicionar 'diretor' se não estiver presente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
        AND enumlabel = 'diretor'
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'diretor';
    END IF;
END $$;

-- 3. Atualizar a tabela user_roles para usar o enum se necessário
DO $$
BEGIN
    -- Verificar se a coluna role já é do tipo app_role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'role' 
        AND udt_name = 'app_role'
    ) THEN
        -- Alterar o tipo da coluna para o enum
        ALTER TABLE public.user_roles 
        ALTER COLUMN role TYPE app_role 
        USING role::app_role;
    END IF;
END $$;