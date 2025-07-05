
-- 1. LIMPAR TUDO E RECOMEÇAR DO ZERO
-- Remove todos os triggers e funções relacionados
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Remove todas as políticas RLS da tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Secretaria can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Remove a tabela profiles completamente para recriá-la
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remove tipos conflitantes se existirem
DROP TYPE IF EXISTS public.user_type CASCADE;

-- 2. CRIAR ESTRUTURA LIMPA DO ZERO
-- Cria o tipo ENUM para user_type
CREATE TYPE public.user_type AS ENUM ('secretaria', 'vendedor');

-- 3. CRIAR TABELA PROFILES LIMPA
CREATE TABLE public.profiles (
  id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  user_type public.user_type NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Definir chave primária
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  
  -- Definir chave estrangeira para auth.users
  CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- 4. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS SIMPLES E FUNCIONAIS
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 6. CRIAR FUNÇÃO SIMPLES E ROBUSTA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_name TEXT;
  user_type_value public.user_type;
BEGIN
  -- Extrair nome do metadata com fallback
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário');
  
  -- Extrair user_type do metadata com fallback seguro
  BEGIN
    user_type_value := COALESCE((NEW.raw_user_meta_data->>'user_type')::public.user_type, 'vendedor'::public.user_type);
  EXCEPTION WHEN OTHERS THEN
    user_type_value := 'vendedor'::public.user_type;
  END;
  
  -- Inserir perfil
  INSERT INTO public.profiles (id, email, name, user_type)
  VALUES (NEW.id, NEW.email, user_name, user_type_value);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro para debug
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 7. CRIAR TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
