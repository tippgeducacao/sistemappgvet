-- Limpar grupos inválidos dos vendedores
-- Criar função para limpar grupos que não existem mais
CREATE OR REPLACE FUNCTION public.clean_invalid_pos_graduacoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Limpar grupos inválidos do Adones especificamente
  UPDATE public.profiles 
  SET pos_graduacoes = ARRAY[]::uuid[] 
  WHERE email = 'adones@ppgvet.com' 
    AND pos_graduacoes @> ARRAY['ebac679d-e53b-451e-a4f6-8ff48854c3cf']::uuid[];
  
  -- Limpar grupos inválidos de todos os vendedores
  UPDATE public.profiles 
  SET pos_graduacoes = ARRAY(
    SELECT unnest(pos_graduacoes) 
    WHERE unnest(pos_graduacoes) IN (
      SELECT id FROM public.grupos_pos_graduacoes WHERE ativo = true
    )
  )
  WHERE pos_graduacoes IS NOT NULL;
  
  RAISE NOTICE 'Grupos inválidos removidos dos vendedores';
END;
$$;

-- Executar a limpeza
SELECT public.clean_invalid_pos_graduacoes();