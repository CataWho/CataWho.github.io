-- Archivo vivo: esquema público con edición privada.
-- Ejecutar completo en Supabase SQL Editor ANTES de publicar la web.
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  display_name text not null,
  bio text default '', avatar_url text, layout jsonb not null default '{}'::jsonb, is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.items (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check(type in ('music','book','channel','note','article','photo')),
  title text not null, detail text default '', kind text default '', external_url text, image_url text,
  catalog_provider text, catalog_id text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text default '', code text not null, canvas_width integer default 600,
  canvas_height integer default 400, is_public boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.projects enable row level security;
revoke all on public.profiles, public.items, public.projects from anon, authenticated;
grant select on public.profiles, public.items, public.projects to anon, authenticated;
grant insert, update, delete on public.profiles, public.items, public.projects to authenticated;

create policy "public profiles read" on public.profiles for select to anon, authenticated using (is_public or owner_id=(select auth.uid()));
create policy "owner creates profile" on public.profiles for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "owner updates profile" on public.profiles for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy "owner deletes profile" on public.profiles for delete to authenticated using (owner_id=(select auth.uid()));

create policy "public items read" on public.items for select to anon, authenticated using (exists(select 1 from public.profiles p where p.id=profile_id and (p.is_public or p.owner_id=(select auth.uid()))));
create policy "owner writes items" on public.items for all to authenticated using (exists(select 1 from public.profiles p where p.id=profile_id and p.owner_id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.owner_id=(select auth.uid())));
create policy "public projects read" on public.projects for select to anon, authenticated using (is_public and exists(select 1 from public.profiles p where p.id=profile_id and p.is_public) or exists(select 1 from public.profiles p where p.id=profile_id and p.owner_id=(select auth.uid())));
create policy "owner writes projects" on public.projects for all to authenticated using (exists(select 1 from public.profiles p where p.id=profile_id and p.owner_id=(select auth.uid()))) with check (exists(select 1 from public.profiles p where p.id=profile_id and p.owner_id=(select auth.uid())));

insert into storage.buckets(id,name,public) values('archive-media','archive-media',true) on conflict(id) do nothing;
create policy "public media read" on storage.objects for select to anon,authenticated using(bucket_id='archive-media');
create policy "owner uploads media" on storage.objects for insert to authenticated with check(bucket_id='archive-media' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owner changes media" on storage.objects for update to authenticated using(bucket_id='archive-media' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owner deletes media" on storage.objects for delete to authenticated using(bucket_id='archive-media' and (storage.foldername(name))[1]=(select auth.uid()::text));

-- La primera vez que Cata entra por magic link a admin.html, la web crea su perfil automáticamente.
-- Hacelo antes de publicar: así nadie más puede tomar el slug "cata".
