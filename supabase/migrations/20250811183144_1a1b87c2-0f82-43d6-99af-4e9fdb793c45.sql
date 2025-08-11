-- Verificar se já existem níveis SDR
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.niveis_vendedores 
    WHERE tipo_usuario = 'sdr' AND nivel = 'junior'
  ) THEN
    INSERT INTO public.niveis_vendedores (
      nivel,
      tipo_usuario,
      fixo_mensal,
      vale,
      variavel_semanal,
      meta_semanal_vendedor,
      meta_semanal_inbound,
      meta_semanal_outbound,
      meta_vendas_cursos
    ) VALUES
      ('sdr_junior', 'sdr', 0, 0, 0, 0, 0, 0, 0),
      ('sdr_pleno', 'sdr', 0, 0, 0, 0, 0, 0, 0),
      ('sdr_senior', 'sdr', 0, 0, 0, 0, 0, 0, 0);
  END IF;
END $$;