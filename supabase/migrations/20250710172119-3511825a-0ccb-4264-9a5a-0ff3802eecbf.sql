-- Atualizar modalidade dos cursos que contêm "Pós-graduação" no nome
UPDATE public.cursos 
SET modalidade = 'Pós-Graduação' 
WHERE nome ILIKE '%pós-graduação%' OR nome ILIKE '%pós-grad%';

-- Remover o curso "Outro"
DELETE FROM public.cursos WHERE nome = 'Outro';

-- Corrigir política RLS para permitir que usuários autenticados criem cursos
DROP POLICY IF EXISTS "Admins can manage courses" ON public.cursos;

CREATE POLICY "Admins can manage courses" ON public.cursos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'secretaria')
  )
);