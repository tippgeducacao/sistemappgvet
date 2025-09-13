-- Adicionar política específica para vendedores verem alunos das suas vendas
CREATE POLICY "Vendedores podem ver alunos das suas vendas"
ON public.alunos
FOR SELECT
TO authenticated
USING (
  -- Permite acesso se o aluno pertence a uma venda do usuário logado
  EXISTS (
    SELECT 1 FROM public.form_entries fe
    WHERE fe.aluno_id = alunos.id 
    AND fe.vendedor_id = auth.uid()
  )
  OR
  -- Mantém as permissões existentes para admins/diretores/secretarias
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.user_type IN ('admin', 'diretor', 'secretaria')
  )
);