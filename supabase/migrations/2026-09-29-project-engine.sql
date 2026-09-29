-- Correr una vez en Supabase → SQL Editor, sobre un Archivo vivo que ya existe.
-- Agrega a cada proyecto del laboratorio el lenguaje en el que está hecho.
-- Los proyectos que ya tenías quedan como p5.js.
alter table public.projects
  add column if not exists engine text not null default 'p5'
  check (engine in ('p5', 'hydra'));

notify pgrst, 'reload schema';
