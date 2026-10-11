-- ============================================================================
-- 007 · temas transversales del catálogo
--
-- Para qué:
--   Con tres temas (tecnología, economía y finanzas), casi toda noticia
--   comparte «Economía» y las relacionadas del lector se ordenan solo por
--   alcance y fecha (D-31). Tres temas que cruzan lo local y lo internacional
--   hacen visible ese cruce y dan más variedad al onboarding (D-32).
--
-- Requiere: 003_articles.sql (tabla topics).
--
-- Cómo funciona:
--   - Agrega empleo, migración y remesas, e inteligencia artificial.
--   - Los slugs son únicos: si un tema ya existe, solo se actualiza su etiqueta.
--   - No toca noticias ni permisos: la tabla y sus políticas ya existen.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
--   Solo después de que su PR llegue a main: dev y producción comparten la base.
-- ============================================================================

insert into public.topics (slug, label) values
  ('empleo',                  'Empleo'),
  ('migracion-y-remesas',     'Migración y remesas'),
  ('inteligencia-artificial', 'Inteligencia artificial')
on conflict (slug) do update set label = excluded.label;
