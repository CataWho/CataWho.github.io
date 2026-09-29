-- Run once in Supabase SQL Editor on an existing Archivo vivo project.
alter table public.profiles
  add column if not exists layout jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
