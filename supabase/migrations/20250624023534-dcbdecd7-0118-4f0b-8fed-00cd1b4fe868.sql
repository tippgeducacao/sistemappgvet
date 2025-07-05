
-- Função para buscar arquivos no bucket documentos-vendas
CREATE OR REPLACE FUNCTION public.find_document_in_bucket(
  search_pattern TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Buscar arquivo que contenha o padrão de busca
  SELECT name INTO file_path
  FROM storage.objects 
  WHERE bucket_id = 'documentos-vendas' 
    AND name ILIKE '%' || search_pattern || '%'
    AND (name ILIKE '%.png' OR name ILIKE '%.jpg' OR name ILIKE '%.jpeg')
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN file_path;
END;
$$;

-- Função para listar todos os arquivos de uma pasta específica
CREATE OR REPLACE FUNCTION public.list_bucket_files(
  bucket_name TEXT,
  folder_prefix TEXT DEFAULT ''
) RETURNS TABLE (
  file_name TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  file_size BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    split_part(name, '/', -1) as file_name,
    name as file_path,
    storage.objects.created_at,
    metadata->>'size'::BIGINT as file_size
  FROM storage.objects 
  WHERE bucket_id = bucket_name
    AND (folder_prefix = '' OR name LIKE folder_prefix || '%')
    AND (name ILIKE '%.png' OR name ILIKE '%.jpg' OR name ILIKE '%.jpeg')
  ORDER BY created_at DESC;
END;
$$;

-- Função para encontrar documento por venda ID
CREATE OR REPLACE FUNCTION public.find_document_by_venda_id(
  venda_id_param TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
DECLARE
  file_path TEXT;
  venda_short TEXT;
BEGIN
  -- Primeiro, tentar encontrar por ID completo
  SELECT name INTO file_path
  FROM storage.objects 
  WHERE bucket_id = 'documentos-vendas' 
    AND name ILIKE '%' || venda_id_param || '%'
    AND (name ILIKE '%.png' OR name ILIKE '%.jpg' OR name ILIKE '%.jpeg')
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não encontrar, tentar com os primeiros 8 caracteres
  IF file_path IS NULL THEN
    venda_short := substring(venda_id_param from 1 for 8);
    SELECT name INTO file_path
    FROM storage.objects 
    WHERE bucket_id = 'documentos-vendas' 
      AND name ILIKE '%' || venda_short || '%'
      AND (name ILIKE '%.png' OR name ILIKE '%.jpg' OR name ILIKE '%.jpeg')
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN file_path;
END;
$$;
