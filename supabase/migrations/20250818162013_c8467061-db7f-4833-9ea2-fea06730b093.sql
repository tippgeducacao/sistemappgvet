-- Verificar constraint atual
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass AND contype = 'c';

-- Remover constraint existente e recriar com supervisor incluído
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Criar nova constraint incluindo supervisor
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('admin', 'secretaria', 'vendedor', 'diretor', 'sdr_inbound', 'sdr_outbound', 'sdr', 'coordenador', 'supervisor'));