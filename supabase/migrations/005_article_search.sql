-- ============================================================================
-- 005 · búsqueda de noticias por texto
--
-- Para qué:
--   El chat busca las noticias publicadas que coinciden con la pregunta del
--   lector (CIC-18, D-24). Buscar con un índice no llama a ningún modelo (RP-03).
--
-- Requiere: 003_articles.sql.
--
-- Cómo funciona:
--   - articles.search es una columna calculada por la base con el título y la
--     entradilla, en español: ignora mayúsculas, tildes de conjugación y palabras
--     vacías («el», «de»…). Se actualiza sola al insertar o cambiar una noticia.
--   - El índice GIN hace que la búsqueda no recorra toda la tabla.
--   - No cambia permisos: quien puede leer articles puede buscar.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
-- ============================================================================

alter table public.articles
  add column if not exists search tsvector
  generated always as (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(summary, '')), 'B')
  ) stored;

create index if not exists articles_search_idx on public.articles using gin (search);
