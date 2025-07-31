-- Adicionar campo para contador de semanas consecutivas de meta batida
ALTER TABLE public.profiles 
ADD COLUMN semanas_consecutivas_meta integer DEFAULT 0;