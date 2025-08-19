-- Criar políticas RLS para permitir leitura pública de dados básicos para ranking

-- Política para leitura pública de form_entries (apenas vendas matriculadas)
CREATE POLICY "Public read matriculated sales for ranking" ON public.form_entries
FOR SELECT
TO PUBLIC
USING (status = 'matriculado');

-- Política para leitura pública de profiles (vendedores ativos)
CREATE POLICY "Public read active vendors for ranking" ON public.profiles
FOR SELECT
TO PUBLIC
USING (ativo = true AND user_type IN ('vendedor', 'sdr'));

-- Política para leitura pública de niveis_vendedores
CREATE POLICY "Public read vendor levels for ranking" ON public.niveis_vendedores
FOR SELECT
TO PUBLIC
USING (true);

-- Política para leitura pública de agendamentos (apenas com resultado de reunião)
CREATE POLICY "Public read completed appointments for ranking" ON public.agendamentos
FOR SELECT
TO PUBLIC
USING (resultado_reuniao IS NOT NULL);

-- Política para leitura pública de cursos
CREATE POLICY "Public read courses for ranking" ON public.cursos
FOR SELECT
TO PUBLIC
USING (true);

-- Política para leitura pública de alunos
CREATE POLICY "Public read students for ranking" ON public.alunos
FOR SELECT
TO PUBLIC
USING (true);