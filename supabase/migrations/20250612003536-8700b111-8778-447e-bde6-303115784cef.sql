
-- Criar enum para roles de usuário
CREATE TYPE user_role AS ENUM ('secretaria', 'vendedor');

-- Criar enum para status do formulário
CREATE TYPE form_status AS ENUM ('pendente', 'matriculado', 'desistiu');

-- Criar enum para status dos ticks
CREATE TYPE tick_status AS ENUM ('ok', 'pendente');

-- Criar enum para tipos de ação no histórico
CREATE TYPE validation_action AS ENUM ('marcou_ok', 'pendencia', 'status_alterado');

-- Tabela de usuários (complementa a tabela profiles existente)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'vendedor',
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de entradas de formulário
CREATE TABLE public.form_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES public.users(id),
  status form_status NOT NULL DEFAULT 'pendente',
  pontuacao_esperada FLOAT DEFAULT 0,
  pontuacao_validada FLOAT,
  motivo_pendencia TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  crmv TEXT,
  form_entry_id UUID NOT NULL REFERENCES public.form_entries(id) ON DELETE CASCADE
);

-- Tabela de respostas do formulário
CREATE TABLE public.respostas_formulario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_entry_id UUID NOT NULL REFERENCES public.form_entries(id) ON DELETE CASCADE,
  campo_nome TEXT NOT NULL,
  valor_informado TEXT NOT NULL,
  tick_status tick_status
);

-- Tabela de regras de pontuação
CREATE TABLE public.regras_pontuacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_nome TEXT NOT NULL,
  opcao_valor TEXT NOT NULL,
  pontos FLOAT NOT NULL DEFAULT 0,
  criado_por UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campo_nome, opcao_valor)
);

-- Tabela de histórico de validações
CREATE TABLE public.historico_validacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_entry_id UUID NOT NULL REFERENCES public.form_entries(id) ON DELETE CASCADE,
  secretaria_id UUID NOT NULL REFERENCES public.users(id),
  acao validation_action NOT NULL,
  descricao TEXT,
  data TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir algumas regras de pontuação iniciais
INSERT INTO public.regras_pontuacao (campo_nome, opcao_valor, pontos) VALUES
-- Forma de Pagamento
('Forma de Pagamento', 'Cartão de crédito à vista', 25),
('Forma de Pagamento', 'PIX à vista', 25),
('Forma de Pagamento', 'Boleto à vista', 20),
('Forma de Pagamento', 'Cartão parcelado 2x', 15),
('Forma de Pagamento', 'Cartão parcelado 3x ou mais', 10),

-- Curso escolhido
('Curso', 'Cirurgia', 30),
('Curso', 'Cardiologia', 28),
('Curso', 'Dermatologia', 25),
('Curso', 'Anestesia', 25),
('Curso', 'Oftalmologia', 22),
('Curso', 'Ortopedia', 20),
('Curso', 'Neurologia', 20),
('Curso', 'Oncologia', 18),

-- Como conheceu o curso
('Como Conheceu', 'Indicação de colega', 20),
('Como Conheceu', 'Redes sociais', 15),
('Como Conheceu', 'Site da empresa', 12),
('Como Conheceu', 'Google/Busca', 10),
('Como Conheceu', 'WhatsApp', 8),
('Como Conheceu', 'Outros', 5),

-- Experiência profissional
('Experiência', 'Mais de 10 anos', 15),
('Experiência', '5 a 10 anos', 12),
('Experiência', '2 a 5 anos', 8),
('Experiência', 'Até 2 anos', 5),
('Experiência', 'Recém-formado', 3);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_formulario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regras_pontuacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_validacoes ENABLE ROW LEVEL SECURITY;

-- Policies para users (todos podem ver, mas só podem editar próprios dados)
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (id = auth.uid());

-- Policies para form_entries
CREATE POLICY "Vendedores can view own entries" ON public.form_entries FOR SELECT USING (vendedor_id = auth.uid());
CREATE POLICY "Secretaria can view all entries" ON public.form_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria')
);
CREATE POLICY "Vendedores can create entries" ON public.form_entries FOR INSERT WITH CHECK (vendedor_id = auth.uid());
CREATE POLICY "Secretaria can update entries" ON public.form_entries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria')
);

-- Policies para alunos
CREATE POLICY "Users can view alunos from accessible forms" ON public.alunos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_entries fe 
    WHERE fe.id = form_entry_id 
    AND (fe.vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria'))
  )
);
CREATE POLICY "Vendedores can create alunos" ON public.alunos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.form_entries WHERE id = form_entry_id AND vendedor_id = auth.uid())
);

-- Policies para respostas_formulario
CREATE POLICY "Users can view respostas from accessible forms" ON public.respostas_formulario FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_entries fe 
    WHERE fe.id = form_entry_id 
    AND (fe.vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria'))
  )
);
CREATE POLICY "Vendedores can create respostas" ON public.respostas_formulario FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.form_entries WHERE id = form_entry_id AND vendedor_id = auth.uid())
);
CREATE POLICY "Secretaria can update respostas" ON public.respostas_formulario FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria')
);

-- Policies para regras_pontuacao (todos podem ler, só secretaria pode modificar)
CREATE POLICY "Everyone can view regras" ON public.regras_pontuacao FOR SELECT USING (true);
CREATE POLICY "Secretaria can manage regras" ON public.regras_pontuacao FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria')
);

-- Policies para historico_validacoes
CREATE POLICY "Users can view relevant history" ON public.historico_validacoes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.form_entries fe 
    WHERE fe.id = form_entry_id 
    AND (fe.vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria'))
  )
);
CREATE POLICY "Secretaria can create history" ON public.historico_validacoes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'secretaria')
);

-- Função para calcular pontuação automaticamente
CREATE OR REPLACE FUNCTION calcular_pontuacao_formulario(form_entry_id_param UUID)
RETURNS FLOAT AS $$
DECLARE
  total_pontos FLOAT := 0;
  resposta RECORD;
BEGIN
  FOR resposta IN 
    SELECT rf.campo_nome, rf.valor_informado, COALESCE(rp.pontos, 0) as pontos
    FROM public.respostas_formulario rf
    LEFT JOIN public.regras_pontuacao rp ON rf.campo_nome = rp.campo_nome AND rf.valor_informado = rp.opcao_valor
    WHERE rf.form_entry_id = form_entry_id_param
  LOOP
    total_pontos := total_pontos + resposta.pontos;
  END LOOP;
  
  RETURN total_pontos;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar pontuação automaticamente
CREATE OR REPLACE FUNCTION update_pontuacao_trigger()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.form_entries 
  SET pontuacao_esperada = calcular_pontuacao_formulario(NEW.form_entry_id),
      atualizado_em = now()
  WHERE id = NEW.form_entry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pontuacao
  AFTER INSERT OR UPDATE ON public.respostas_formulario
  FOR EACH ROW
  EXECUTE FUNCTION update_pontuacao_trigger();
