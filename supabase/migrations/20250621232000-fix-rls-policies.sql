
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.form_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formulario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_pontuacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_validacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para FORM_ENTRIES
-- Vendedores podem ver apenas suas próprias vendas
CREATE POLICY "Vendedores podem ver suas vendas" ON public.form_entries
    FOR SELECT USING (
        auth.uid() = vendedor_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Vendedores podem inserir vendas para si mesmos
CREATE POLICY "Vendedores podem inserir vendas" ON public.form_entries
    FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

-- Secretaria pode atualizar qualquer venda, vendedores podem atualizar apenas as suas
CREATE POLICY "Vendedores e secretaria podem atualizar vendas" ON public.form_entries
    FOR UPDATE USING (
        auth.uid() = vendedor_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Políticas para ALUNOS
-- Vendedores podem ver alunos de suas vendas, secretaria vê todos
CREATE POLICY "Vendedores podem ver alunos de suas vendas" ON public.alunos
    FOR SELECT USING (
        auth.uid() = vendedor_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Qualquer vendedor autenticado pode inserir alunos
CREATE POLICY "Vendedores podem inserir alunos" ON public.alunos
    FOR INSERT WITH CHECK (auth.uid() = vendedor_id);

-- Políticas para CURSOS
-- Todos podem ver cursos ativos
CREATE POLICY "Todos podem ver cursos ativos" ON public.cursos
    FOR SELECT USING (ativo = true);

-- Apenas secretaria pode inserir/atualizar cursos
CREATE POLICY "Secretaria pode gerenciar cursos" ON public.cursos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Políticas para PROFILES
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seu perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Secretaria pode ver todos os perfis
CREATE POLICY "Secretaria pode ver todos os perfis" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p2
            WHERE p2.id = auth.uid() 
            AND p2.user_type = 'secretaria'
        )
    );

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para RESPOSTAS_FORMULARIO
-- Relacionadas às vendas do vendedor ou secretaria vê todas
CREATE POLICY "Acesso às respostas do formulário" ON public.respostas_formulario
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.form_entries fe
            WHERE fe.id = form_entry_id 
            AND (fe.vendedor_id = auth.uid() OR 
                 EXISTS (
                     SELECT 1 FROM public.profiles 
                     WHERE profiles.id = auth.uid() 
                     AND profiles.user_type = 'secretaria'
                 ))
        )
    );

-- Vendedores podem inserir respostas para suas vendas
CREATE POLICY "Vendedores podem inserir respostas" ON public.respostas_formulario
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.form_entries fe
            WHERE fe.id = form_entry_id 
            AND fe.vendedor_id = auth.uid()
        )
    );

-- Políticas para REGRAS_PONTUACAO
-- Todos podem ver regras de pontuação
CREATE POLICY "Todos podem ver regras de pontuação" ON public.regras_pontuacao
    FOR SELECT USING (true);

-- Apenas secretaria pode gerenciar regras
CREATE POLICY "Secretaria pode gerenciar regras" ON public.regras_pontuacao
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Políticas para HISTORICO_VALIDACOES
-- Secretaria pode ver e inserir histórico
CREATE POLICY "Secretaria pode gerenciar histórico" ON public.historico_validacoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'secretaria'
        )
    );

-- Vendedores podem ver histórico de suas vendas
CREATE POLICY "Vendedores podem ver histórico de suas vendas" ON public.historico_validacoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.form_entries fe
            WHERE fe.id = form_entry_id 
            AND fe.vendedor_id = auth.uid()
        )
    );
