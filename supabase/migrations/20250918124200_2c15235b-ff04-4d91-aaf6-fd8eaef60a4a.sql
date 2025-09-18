-- Verificar se já existe uma coluna para data de inativação
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inativado_em timestamp with time zone;

-- Atualizar usuários já marcados como inativos sem data para o início do mês atual
UPDATE public.profiles 
SET inativado_em = date_trunc('month', now())
WHERE ativo = false AND inativado_em IS NULL;

-- Criar função trigger para automaticamente marcar data de inativação
CREATE OR REPLACE FUNCTION public.mark_inactivation_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário está sendo marcado como inativo e não tinha data de inativação
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.inativado_em IS NULL THEN
    NEW.inativado_em = now();
  -- Se o usuário está sendo reativado, limpar a data de inativação  
  ELSIF NEW.ativo = true AND OLD.ativo = false THEN
    NEW.inativado_em = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para marcar automaticamente a data de inativação
DROP TRIGGER IF EXISTS trigger_mark_inactivation_date ON public.profiles;
CREATE TRIGGER trigger_mark_inactivation_date
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_inactivation_date();