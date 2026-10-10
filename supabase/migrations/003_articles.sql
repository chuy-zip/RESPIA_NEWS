-- ============================================================================
-- 003 · noticias, regiones y temas
--
-- Para qué:
--   Guardar las noticias que publica el portal (RF-15, RF-16) y el catálogo de
--   regiones y temas con el que se clasifican. Los nombres siguen los tipos de
--   src/types/news.ts.
--
-- Requiere: 001_admins.sql (usa private.is_admin()).
--
-- Cómo funciona:
--   - Solo las cuentas con sesión leen. Sin sesión no se entrega contenido (RF-02):
--     anon no tiene ningún GRANT.
--   - Solo un administrador inserta noticias (RT-04). Nadie edita ni borra desde
--     la app: no hay GRANT ni política para esas operaciones.
--   - Regiones y temas se cargan aquí, desde el SQL Editor. La app solo los lee.
--   - body, sources e image van como JSON dentro de la noticia: siempre se leen
--     con ella. Regiones y temas van en tablas de relación porque el feed y el
--     chat filtran por ellos.
--   - La base repite la regla de estado más simple (RT-03): una noticia
--     confirmada tiene al menos dos fuentes. El servidor aplica la regla completa.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
--   Solo después de que su PR llegue a main: dev y producción comparten la base.
-- ============================================================================

create table if not exists public.regions (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,
  label text not null
);

create table if not exists public.topics (
  id    uuid primary key default gen_random_uuid(),
  slug  text not null unique,
  label text not null
);

create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) > 0),
  summary      text not null check (length(trim(summary)) > 0),
  -- ContentBlock[]: párrafos y subtítulos en texto plano, nunca HTML.
  body         jsonb not null check (jsonb_typeof(body) = 'array'),
  -- Source[]: al menos una fuente con nombre y URL.
  sources      jsonb not null check (
                 jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) >= 1
               ),
  published_at timestamptz not null,
  status       text not null check (status in ('confirmed', 'developing', 'unconfirmed')),
  content_type text not null check (content_type in ('original', 'summary', 'ai_contribution')),
  review_note  text not null,
  important    boolean not null default false,
  author       text,
  -- ImageProvenance, o null si la noticia no tiene imagen.
  image        jsonb check (image is null or jsonb_typeof(image) = 'object'),
  created_by   uuid not null default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  constraint articles_confirmed_needs_two_sources
    check (status <> 'confirmed' or jsonb_array_length(sources) >= 2)
);

create index if not exists articles_published_at_idx on public.articles (published_at desc);

create table if not exists public.article_regions (
  article_id uuid not null references public.articles (id) on delete cascade,
  region_id  uuid not null references public.regions (id),
  primary key (article_id, region_id)
);

create table if not exists public.article_topics (
  article_id uuid not null references public.articles (id) on delete cascade,
  topic_id   uuid not null references public.topics (id),
  primary key (article_id, topic_id)
);

create index if not exists article_regions_region_idx on public.article_regions (region_id);
create index if not exists article_topics_topic_idx on public.article_topics (topic_id);

-- ----------------------------------------------------------------------------
-- Permisos
--
-- Supabase da todos los privilegios a anon y authenticated en las tablas nuevas
-- de public. Se quitan y se conceden solo los necesarios.
-- ----------------------------------------------------------------------------

alter table public.regions         enable row level security;
alter table public.topics          enable row level security;
alter table public.articles        enable row level security;
alter table public.article_regions enable row level security;
alter table public.article_topics  enable row level security;

revoke all on public.regions, public.topics, public.articles,
              public.article_regions, public.article_topics
  from anon, authenticated;

grant select on public.regions, public.topics, public.articles,
                public.article_regions, public.article_topics
  to authenticated;

grant insert on public.articles, public.article_regions, public.article_topics
  to authenticated;

drop policy if exists "regions: con sesión leen" on public.regions;
create policy "regions: con sesión leen"
  on public.regions for select to authenticated using (true);

drop policy if exists "topics: con sesión leen" on public.topics;
create policy "topics: con sesión leen"
  on public.topics for select to authenticated using (true);

drop policy if exists "articles: con sesión leen" on public.articles;
create policy "articles: con sesión leen"
  on public.articles for select to authenticated using (true);

drop policy if exists "articles: admins insertan" on public.articles;
create policy "articles: admins insertan"
  on public.articles for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists "article_regions: con sesión leen" on public.article_regions;
create policy "article_regions: con sesión leen"
  on public.article_regions for select to authenticated using (true);

drop policy if exists "article_regions: admins insertan" on public.article_regions;
create policy "article_regions: admins insertan"
  on public.article_regions for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "article_topics: con sesión leen" on public.article_topics;
create policy "article_topics: con sesión leen"
  on public.article_topics for select to authenticated using (true);

drop policy if exists "article_topics: admins insertan" on public.article_topics;
create policy "article_topics: admins insertan"
  on public.article_topics for insert to authenticated
  with check ((select private.is_admin()));

-- ----------------------------------------------------------------------------
-- Catálogo inicial
--
-- Regiones: los siete países de Centroamérica más «Internacional» (D-26, D-31).
-- Temas: los de la interfaz editorial, con sus mismos slugs.
-- ----------------------------------------------------------------------------

insert into public.regions (slug, label) values
  ('guatemala',     'Guatemala'),
  ('belice',        'Belice'),
  ('el-salvador',   'El Salvador'),
  ('honduras',      'Honduras'),
  ('nicaragua',     'Nicaragua'),
  ('costa-rica',    'Costa Rica'),
  ('panama',        'Panamá'),
  ('internacional', 'Internacional')
on conflict (slug) do update set label = excluded.label;

insert into public.topics (slug, label) values
  ('tecnologia', 'Tecnología'),
  ('economia',   'Economía'),
  ('finanzas',   'Finanzas')
on conflict (slug) do update set label = excluded.label;
