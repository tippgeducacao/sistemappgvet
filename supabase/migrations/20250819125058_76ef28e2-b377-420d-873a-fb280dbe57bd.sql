-- Corrigir políticas RLS para grupos_supervisores e membros_grupos_supervisores

-- Remover políticas existentes problemáticas
DROP POLICY IF EXISTS "Supervisores podem gerenciar seus grupos" ON public.grupos_supervisores;
DROP POLICY IF EXISTS "Supervisores podem gerenciar membros de seus grupos" ON public.membros_grupos_supervisores;

-- Políticas para grupos_supervisores
CREATE POLICY "Usuários autenticados podem ver grupos" 
ON public.grupos_supervisores 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Supervisores podem criar grupos" 
ON public.grupos_supervisores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'supervisor'
  )
  AND supervisor_id = auth.uid()
);

CREATE POLICY "Supervisores podem atualizar seus grupos" 
ON public.grupos_supervisores 
FOR UPDATE 
USING (
  supervisor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
)
WITH CHECK (
  supervisor_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);

CREATE POLICY "Admins podem deletar grupos" 
ON public.grupos_supervisores 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor')
  )
);

-- Políticas para membros_grupos_supervisores
CREATE POLICY "Usuários autenticados podem ver membros" 
ON public.membros_grupos_supervisores 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Supervisores podem adicionar membros aos seus grupos" 
ON public.membros_grupos_supervisores 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.grupos_supervisores gs
    WHERE gs.id = grupo_id 
    AND (
      gs.supervisor_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'diretor', 'secretaria')
      )
    )
  )
);

CREATE POLICY "Supervisores podem remover membros dos seus grupos" 
ON public.membros_grupos_supervisores 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.grupos_supervisores gs
    WHERE gs.id = grupo_id 
    AND (
      gs.supervisor_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'diretor', 'secretaria')
      )
    )
  )
);

CREATE POLICY "Admins podem atualizar membros" 
ON public.membros_grupos_supervisores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'diretor', 'secretaria')
  )
);