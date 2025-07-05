
-- Habilitar RLS na tabela regras_pontuacao
ALTER TABLE public.regras_pontuacao ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário autenticado veja as regras
CREATE POLICY "Anyone can view scoring rules" 
  ON public.regras_pontuacao 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Política para permitir que apenas secretarias insiram novas regras
CREATE POLICY "Only secretaria can insert scoring rules" 
  ON public.regras_pontuacao 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'secretaria'
    )
  );

-- Política para permitir que apenas secretarias atualizem regras
CREATE POLICY "Only secretaria can update scoring rules" 
  ON public.regras_pontuacao 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'secretaria'
    )
  );

-- Política para permitir que apenas secretarias deletem regras
CREATE POLICY "Only secretaria can delete scoring rules" 
  ON public.regras_pontuacao 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND user_type = 'secretaria'
    )
  );
