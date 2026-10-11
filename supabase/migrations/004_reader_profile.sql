-- ============================================================================
-- 004 · perfil del lector y señales de lectura
--
-- Para qué:
--   Guardar la región simulada que elige el lector (RF-04), los temas que elige
--   (D-32) y las señales con las que el recomendador infiere sus intereses
--   (RF-10, D-31).
--
-- Requiere: 003_articles.sql (regiones, temas y noticias).
--
-- Cómo funciona:
--   - Cada lector solo ve y cambia sus propias filas. La identidad sale de
--     auth.uid(): la app nunca envía un user_id. anon no tiene ningún GRANT.
--   - profiles: una fila por lector, creada la primera vez que guarda su región.
--     Sin fila, el lector no eligió región.
--   - reader_topics: los temas que el lector eligió. El peso inicial de 0.5 lo
--     aplica el recomendador, no la base.
--   - interactions: abrir una noticia ('open') o preguntar al chat desde ella
--     ('chat'). La clave primaria hace que cada tipo cuente una vez por noticia y
--     por lector (D-31): repetir la señal no suma.
--   - Las señales no se editan. Se borran con la cuenta o con la noticia.
--
-- Datos del usuario: región, temas y señales van en /privacidad (RF-06).
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
-- ============================================================================

create table if not exists public.profiles (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  region_id  uuid references public.regions (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.reader_topics (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id   uuid not null references public.topics (id),
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create table if not exists public.interactions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  type       text not null check (type in ('open', 'chat')),
  created_at timestamptz not null default now(),
  primary key (user_id, article_id, type)
);

-- ----------------------------------------------------------------------------
-- Permisos
--
-- Supabase da todos los privilegios a anon y authenticated en las tablas nuevas
-- de public. Se quitan y se conceden solo los necesarios.
-- ----------------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.reader_topics enable row level security;
alter table public.interactions  enable row level security;

revoke all on public.profiles, public.reader_topics, public.interactions from anon, authenticated;

grant select, insert, update on public.profiles      to authenticated;
grant select, insert, delete on public.reader_topics to authenticated;
grant select, insert         on public.interactions  to authenticated;

drop policy if exists "profiles: cada lector lee su fila" on public.profiles;
create policy "profiles: cada lector lee su fila"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "profiles: cada lector crea su fila" on public.profiles;
create policy "profiles: cada lector crea su fila"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles: cada lector cambia su fila" on public.profiles;
create policy "profiles: cada lector cambia su fila"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "reader_topics: cada lector lee los suyos" on public.reader_topics;
create policy "reader_topics: cada lector lee los suyos"
  on public.reader_topics for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "reader_topics: cada lector agrega los suyos" on public.reader_topics;
create policy "reader_topics: cada lector agrega los suyos"
  on public.reader_topics for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "reader_topics: cada lector quita los suyos" on public.reader_topics;
create policy "reader_topics: cada lector quita los suyos"
  on public.reader_topics for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "interactions: cada lector lee las suyas" on public.interactions;
create policy "interactions: cada lector lee las suyas"
  on public.interactions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "interactions: cada lector registra las suyas" on public.interactions;
create policy "interactions: cada lector registra las suyas"
  on public.interactions for insert to authenticated
  with check ((select auth.uid()) = user_id);
