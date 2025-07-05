
-- 1. Remove temporariamente as políticas de segurança que dependem da coluna a ser alterada
DROP POLICY IF EXISTS "Secretaria can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 2. Garante que o tipo ENUM user_type existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('secretaria', 'vendedor');
  END IF;
END
$$;

-- 3. Garante a integridade da tabela profiles (Chave primária e estrangeira)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  DROP CONSTRAINT IF EXISTS profiles_pkey;

ALTER TABLE public.profiles
  ADD PRIMARY KEY (id);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 4. Agora sim, corrige a coluna user_type
ALTER TABLE public.profiles
  ALTER COLUMN user_type TYPE text;

ALTER TABLE public.profiles
  ALTER COLUMN user_type TYPE user_type USING user_type::user_type;

ALTER TABLE public.profiles
  ALTER COLUMN user_type SET DEFAULT 'vendedor'::user_type;


-- 5. Recria as políticas de segurança que foram removidas
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Secretaria can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'secretaria'
    )
  );

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);


-- 6. Recria a função e o trigger para garantir que estão atualizados
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'vendedor')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
