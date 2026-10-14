-- ============================================================================
-- 008 · cambiar el estado editorial de una noticia publicada
--
-- Para qué:
--   El estado se elegía solo al publicar. Una noticia en desarrollo que consigue
--   su segunda fuente no podía pasar a confirmada sin entrar a Supabase (RT-03).
--   PATCH /api/admin/articles/[id] lo hace desde la app.
--
-- Requiere: 001_admins.sql (usa private.is_admin()) y 003_articles.sql.
--
-- Cómo funciona:
--   - Solo un administrador actualiza (RT-04).
--   - El GRANT es por columna: solo status y review_note. El título, el
--     contenido, las fuentes y la imagen siguen sin poder editarse desde la app.
--   - La regla de 003 sigue activa: una noticia confirmada tiene al menos dos
--     fuentes.
--   - Nadie borra desde la app: no hay GRANT ni política de delete.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
--   Solo después de que su PR llegue a main: dev y producción comparten la base.
-- ============================================================================

grant update (status, review_note) on public.articles to authenticated;

drop policy if exists "articles: admins cambian el estado" on public.articles;
create policy "articles: admins cambian el estado"
  on public.articles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
