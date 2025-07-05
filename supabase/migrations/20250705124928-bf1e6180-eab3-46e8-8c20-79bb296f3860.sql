
-- Criar tabela user_roles que está faltando
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'secretaria', 'vendedor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para visualizar roles
CREATE POLICY "Users can view user roles" ON public.user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para admins gerenciarem roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);

-- Adicionar coluna vendedor_atribuido na tabela leads se não existir
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS vendedor_atribuido UUID REFERENCES public.profiles(id);

-- Inserir role de admin para o usuário ppgteste@ppgteste.com
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'admin',
    au.id
FROM auth.users au 
WHERE au.email = 'ppgteste@ppgteste.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Inserir role de vendedor para ppgvendedor@ppgvendedor.com
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
    au.id,
    'vendedor',
    au.id
FROM auth.users au 
WHERE au.email = 'ppgvendedor@ppgvendedor.com'
ON CONFLICT (user_id, role) DO NOTHING;
