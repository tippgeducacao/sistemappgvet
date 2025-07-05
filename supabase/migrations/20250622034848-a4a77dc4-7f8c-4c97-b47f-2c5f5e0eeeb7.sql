
-- Primeiro, vamos verificar os valores válidos do enum user_type
SELECT unnest(enum_range(NULL::user_type)) as valid_user_types;

-- Remover políticas existentes para respostas_formulario
DROP POLICY IF EXISTS "Vendedores podem ver respostas de suas vendas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Secretaria pode ver todas as respostas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Vendedores podem inserir respostas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Vendedores podem ver suas respostas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Secretaria vê todas as respostas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Admin vê todas as respostas" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Secretaria pode inserir respostas" ON public.respostas_formulario;

-- Política para vendedores verem apenas suas próprias respostas
CREATE POLICY "Vendedores podem ver suas respostas" ON public.respostas_formulario
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_entries fe
    WHERE fe.id = respostas_formulario.form_entry_id 
    AND fe.vendedor_id = auth.uid()
  )
);

-- Política para secretária ver TODAS as respostas (sem restrições)
CREATE POLICY "Secretaria vê todas as respostas" ON public.respostas_formulario
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'secretaria'
  )
);

-- Política para inserção de respostas pelos vendedores
CREATE POLICY "Vendedores podem inserir respostas" ON public.respostas_formulario
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.form_entries fe
    WHERE fe.id = respostas_formulario.form_entry_id 
    AND fe.vendedor_id = auth.uid()
  )
);

-- Política para inserção de respostas pela secretária
CREATE POLICY "Secretaria pode inserir respostas" ON public.respostas_formulario
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type = 'secretaria'
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.respostas_formulario ENABLE ROW LEVEL SECURITY;
