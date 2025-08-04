-- Adicionar campo para meta de vendas de cursos nos níveis SDR
ALTER TABLE public.niveis_vendedores 
ADD COLUMN meta_vendas_cursos integer NOT NULL DEFAULT 0;

-- Atualizar os valores padrão conforme o documento
-- SDR Junior: 8 cursos, SDR Pleno: 9 cursos, SDR Sênior: 10 cursos
UPDATE public.niveis_vendedores 
SET meta_vendas_cursos = CASE 
  WHEN nivel LIKE '%junior%' AND tipo_usuario = 'sdr' THEN 8
  WHEN nivel LIKE '%pleno%' AND tipo_usuario = 'sdr' THEN 9
  WHEN nivel LIKE '%senior%' AND tipo_usuario = 'sdr' THEN 10
  ELSE 0
END
WHERE tipo_usuario = 'sdr';