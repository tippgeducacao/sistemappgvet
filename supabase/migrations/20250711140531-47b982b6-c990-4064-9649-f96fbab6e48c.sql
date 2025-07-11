-- Atualizar política RLS para permitir apenas diretores gerenciarem pontuações
DROP POLICY "Admins and diretor can manage scoring rules" ON public.regras_pontuacao;

-- Criar nova política apenas para diretores
CREATE POLICY "Only directors can manage scoring rules" 
ON public.regras_pontuacao 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'diretor'::app_role
  )
);