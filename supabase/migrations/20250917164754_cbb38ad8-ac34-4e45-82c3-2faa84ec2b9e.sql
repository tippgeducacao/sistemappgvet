-- Habilitar realtime para as tabelas usadas no TV Ranking
ALTER TABLE public.form_entries REPLICA IDENTITY FULL;
ALTER TABLE public.agendamentos REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.metas_semanais_vendedores REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.form_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metas_semanais_vendedores;