-- Adicionar coluna left_at para rastrear quando membros saíram do grupo
ALTER TABLE public.membros_grupos_supervisores 
ADD COLUMN left_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Adicionar comentário para documentar a funcionalidade
COMMENT ON COLUMN public.membros_grupos_supervisores.left_at IS 'Data em que o membro saiu do grupo. NULL significa que ainda está ativo no grupo.';

-- Criar índice para melhorar performance nas consultas de validação de período
CREATE INDEX idx_membros_grupos_supervisores_left_at ON public.membros_grupos_supervisores(grupo_id, left_at);

-- Atualizar a política RLS para permitir UPDATE da coluna left_at
-- Remover a política existente de UPDATE se existir
DROP POLICY IF EXISTS "Admins podem atualizar membros" ON public.membros_grupos_supervisores;

-- Criar nova política mais específica para UPDATE que permite atualizar left_at
CREATE POLICY "Supervisores podem marcar saída de membros dos seus grupos" 
ON public.membros_grupos_supervisores 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM grupos_supervisores gs
    WHERE gs.id = membros_grupos_supervisores.grupo_id 
    AND (
      gs.supervisor_id = auth.uid() 
      OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = ANY(ARRAY['admin', 'diretor', 'secretaria'])
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM grupos_supervisores gs
    WHERE gs.id = membros_grupos_supervisores.grupo_id 
    AND (
      gs.supervisor_id = auth.uid() 
      OR EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = ANY(ARRAY['admin', 'diretor', 'secretaria'])
      )
    )
  )
);

-- Bloquear DELETE direto na tabela de membros (forçar uso de left_at)
DROP POLICY IF EXISTS "Supervisores podem remover membros dos seus grupos" ON public.membros_grupos_supervisores;

-- Criar nova política que só permite DELETE para admins/diretores (casos excepcionais)
CREATE POLICY "Apenas admins podem deletar membros" 
ON public.membros_grupos_supervisores 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = ANY(ARRAY['admin', 'diretor'])
  )
);

-- Adicionar coluna snapshot_membros na tabela de histórico mensal
ALTER TABLE public.historico_mensal_planilhas 
ADD COLUMN snapshot_membros JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Adicionar comentário
COMMENT ON COLUMN public.historico_mensal_planilhas.snapshot_membros IS 'Snapshot dos membros dos grupos por grupo_id na data do fechamento do mês';