-- Limpar grupos inválidos dos vendedores - versão corrigida
CREATE OR REPLACE FUNCTION public.clean_invalid_pos_graduacoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_record RECORD;
  valid_groups uuid[];
BEGIN
  -- Para cada vendedor com grupos
  FOR vendor_record IN 
    SELECT id, pos_graduacoes 
    FROM public.profiles 
    WHERE pos_graduacoes IS NOT NULL AND array_length(pos_graduacoes, 1) > 0
  LOOP
    -- Filtrar apenas grupos que existem e estão ativos
    SELECT array_agg(g.id) INTO valid_groups
    FROM unnest(vendor_record.pos_graduacoes) AS pg(id)
    JOIN public.grupos_pos_graduacoes g ON g.id = pg.id AND g.ativo = true;
    
    -- Atualizar o vendedor com apenas grupos válidos
    UPDATE public.profiles 
    SET pos_graduacoes = COALESCE(valid_groups, ARRAY[]::uuid[])
    WHERE id = vendor_record.id;
  END LOOP;
  
  RAISE NOTICE 'Grupos inválidos removidos dos vendedores';
END;
$$;

-- Executar a limpeza
SELECT public.clean_invalid_pos_graduacoes();