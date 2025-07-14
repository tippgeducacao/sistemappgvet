-- Remover políticas duplicadas
DROP POLICY IF EXISTS "All authenticated users can view scoring rules" ON public.regras_pontuacao;
DROP POLICY IF EXISTS "All authenticated users can view scoring rules updated" ON public.regras_pontuacao;

-- Recriar uma única política para leitura
CREATE POLICY "Authenticated users can view scoring rules" 
ON public.regras_pontuacao 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);