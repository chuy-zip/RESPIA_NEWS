-- ============================================================================
-- 002 · almacenamiento de imágenes de noticias   (OPCIONAL)
--
-- Para qué:
--   El enunciado pide que el portal ofrezca una forma de obtener o generar una
--   imagen cuando una noticia no la trae. Si esas imágenes se alojan en Supabase
--   Storage, este script crea el bucket. Si las imágenes van a ser enlaces
--   externos, este script no hace falta.
--
-- Requiere: 001_admins.sql (usa private.is_admin()).
--
-- Cómo funciona:
--   - Bucket público: cualquiera puede VER las imágenes por su URL (es contenido
--     de noticias, no datos personales).
--   - Solo los administradores pueden subir, reemplazar o borrar archivos.
--   - Límite de 5 MB por archivo y solo PNG, JPEG y WebP.
--   - El plan Free incluye 1 GB de almacenamiento en total.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images',
  'article-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "article-images: admins suben" on storage.objects;
create policy "article-images: admins suben"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'article-images' and (select private.is_admin()));

drop policy if exists "article-images: admins reemplazan" on storage.objects;
create policy "article-images: admins reemplazan"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'article-images' and (select private.is_admin()))
  with check (bucket_id = 'article-images' and (select private.is_admin()));

drop policy if exists "article-images: admins borran" on storage.objects;
create policy "article-images: admins borran"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'article-images' and (select private.is_admin()));
