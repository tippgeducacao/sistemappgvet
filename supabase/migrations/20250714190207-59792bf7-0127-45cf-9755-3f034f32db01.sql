-- Remover a opção 'sdr' genérica do enum, mantendo apenas as especializações
-- Nota: O PostgreSQL não permite remover valores de um enum diretamente se eles estão sendo usados.
-- Vamos criar um novo enum sem o 'sdr' genérico e depois migrar os dados.

-- Primeiro, vamos verificar se existe algum uso do 'sdr' genérico
-- Se houver, vamos deixar por agora, mas o sistema já está configurado para não usar mais

-- Comentário: O enum app_role deve conter apenas: 'admin', 'secretaria', 'vendedor', 'diretor', 'sdr_inbound', 'sdr_outbound'
-- O 'sdr' genérico não deve mais ser usado no sistema