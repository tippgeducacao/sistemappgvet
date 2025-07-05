
-- Verificar os valores do enum user_type
SELECT unnest(enum_range(NULL::user_type)) as user_types;

-- Corrigir as políticas RLS para a tabela cursos usando apenas valores válidos
-- Primeiro, vamos remover as políticas existentes se houver
DROP POLICY IF EXISTS "Todos podem ver cursos ativos" ON public.cursos;
DROP POLICY IF EXISTS "Secretárias podem gerenciar cursos" ON public.cursos;
DROP POLICY IF EXISTS "Secretárias e admins podem gerenciar cursos" ON public.cursos;

-- Política para permitir que todos vejam cursos ativos
CREATE POLICY "Todos podem ver cursos ativos" 
  ON public.cursos 
  FOR SELECT 
  USING (ativo = true);

-- Política para permitir que usuários autenticados com role secretaria gerenciem cursos
CREATE POLICY "Secretárias podem gerenciar cursos" 
  ON public.cursos 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'secretaria'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'secretaria'
    )
  );
