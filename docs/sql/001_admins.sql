-- ============================================================================
-- 001 · administradores
--
-- Para qué:
--   El portal administrativo necesita saber quién es administrador. Hoy
--   cualquier cuenta de Google obtiene sesión, así que "tener sesión" no basta.
--
-- Cómo funciona:
--   - public.admins lista a los administradores. La identidad que cuenta para dar
--     permisos es user_id: el id del usuario en auth.users, único e inmutable.
--   - La columna email es solo una copia legible, para que quien mire la tabla vea
--     QUIÉN es cada administrador y no una fila de UUID. NO se usa para decidir
--     permisos.
--   - Con la sesión de un usuario solo se puede LEER su propia fila. Nadie puede
--     insertar, editar ni borrar desde la app: la tabla se modifica solo aquí,
--     desde el SQL Editor.
--   - private.is_admin() responde si el usuario actual es administrador. Está
--     pensada para usarse dentro de políticas RLS de otras tablas, por ejemplo:
--         create policy "articles: solo admins escriben" on public.articles
--           for insert to authenticated with check ((select private.is_admin()));
--   - En el código, requireAdmin() de src/lib/auth/dal.ts hace la misma
--     comprobación desde el servidor.
--
-- Por qué se autoriza por user_id y no por el correo:
--   Un correo puede cambiar, y si algún día hubiera otro proveedor de login activo
--   alguien podría llegar a registrar el correo de un administrador. El id no.
--   user_metadata tampoco sirve: lo puede editar el propio usuario.
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run.
--   Es idempotente: se puede ejecutar de nuevo sin romper nada. Si ya existía una
--   versión anterior de la tabla (sin la columna email), esto la agrega.
-- ============================================================================

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Para una tabla creada con una versión anterior de este script.
alter table public.admins add column if not exists email text;

alter table public.admins enable row level security;

-- Sin GRANT de insert/update/delete y sin políticas para esas operaciones: desde
-- la API nadie puede escribir aquí.
grant select on public.admins to authenticated;

drop policy if exists "admins: cada usuario ve solo su fila" on public.admins;
create policy "admins: cada usuario ve solo su fila"
  on public.admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Esquema que la API de datos NO expone. Las funciones auxiliares van aquí.
create schema if not exists private;

-- security definer: se ejecuta con los permisos de quien la creó, para poder leer
-- public.admins sin depender de las políticas del llamador.
-- search_path vacío: evita que alguien redirija los nombres a otro esquema.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- Cómo agregar administradores
--
-- El user_id sale de auth.users, y esa fila se crea la primera vez que la persona
-- inicia sesión con Google: antes de eso no hay id al que apuntar. En el SQL Editor
-- (cambiando los correos):
--
--   insert into public.admins (user_id, email)
--   select id, email from auth.users
--   where lower(email) in ('uno@ejemplo.com', 'dos@ejemplo.com')
--   on conflict (user_id) do update set email = excluded.email;
--
-- Si alguien de la lista todavía no inició sesión, el comando simplemente lo omite,
-- sin error. Se puede ejecutar ya con quienes existen y volver a ejecutar, con la
-- misma lista, cuando entren los que faltan.
--
-- Para ver quiénes son administradores:
--
--   select user_id, email, created_at from public.admins order by created_at;
--
-- Para quitar a alguien:
--
--   delete from public.admins
--   where user_id = (select id from auth.users where email = 'uno@ejemplo.com');
--
-- Los correos reales NO se escriben en el repositorio: es público.
-- ----------------------------------------------------------------------------
