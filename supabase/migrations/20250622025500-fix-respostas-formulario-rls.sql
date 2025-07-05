
-- Remover políticas existentes para respostas_formulario
DROP POLICY IF EXISTS "Acesso às respostas do formulário" ON public.respostas_formulario;
DROP POLICY IF EXISTS "Vendedores podem inserir respostas" ON public.respostas_formulario;

-- Política para permitir que vendedores vejam respostas de suas próprias vendas
CREATE POLICY "Vendedores podem ver respostas de suas vendas" ON public.respostas_formulario
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_entries fe
    WHERE fe.id = form_entry_id 
    AND fe.vendedor_id = auth.uid()
  )
);

-- Política para permitir que secretária veja todas as respostas
CREATE POLICY "Secretaria pode ver todas as respostas" ON public.respostas_formulario
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'secretaria'
  )
);

-- Política para permitir que vendedores insiram respostas para suas vendas
CREATE POLICY "Vendedores podem inserir respostas" ON public.respostas_formulario
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.form_entries fe
    WHERE fe.id = form_entry_id 
    AND fe.vendedor_id = auth.uid()
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE public.respostas_formulario ENABLE ROW LEVEL SECURITY;
