-- ============================================================================
-- 006 · registro de uso y costo de IA
--
-- Para qué:
--   Registrar cada llamada a un modelo y cada búsqueda en Tavily, para consultar
--   el gasto, el saldo y el costo por función, y para que el módulo de costo
--   bloquee al llegar al tope (RP-01, RP-02, CIC-15).
--
-- Requiere: 001_admins.sql (usa private.is_admin()).
--
-- Cómo funciona:
--   - Nadie lee ni escribe la tabla directo: no tiene GRANT. La app usa tres
--     funciones security definer: record_ai_usage y ai_spend_total (cuentas con
--     sesión) y ai_usage_summary (solo administradores). Detalle y riesgo
--     aceptado en specs/ia/costos-ia.md: no hace falta una llave de servicio.
--   - No guarda user_id ni el texto de la pregunta: no es un dato del usuario
--     y no cambia /privacidad (RF-06).
--
-- Cómo se aplica:
--   Supabase → SQL Editor → pegar este archivo completo → Run. Idempotente.
--   Solo después de que su PR llegue a main: dev y producción comparten la base.
-- ============================================================================

create table if not exists public.ai_usage (
  id                 bigint generated always as identity primary key,
  created_at         timestamptz not null default now(),
  function_name      text not null check (function_name in ('responderChat', 'elegirImagen', 'buscarExterno')),
  model              text not null check (length(model) between 1 and 100),
  environment        text not null check (environment in ('local', 'preview', 'production')),
  input_tokens       integer not null default 0 check (input_tokens >= 0),
  output_tokens      integer not null default 0 check (output_tokens >= 0),
  cache_read_tokens  integer not null default 0 check (cache_read_tokens >= 0),
  cache_write_tokens integer not null default 0 check (cache_write_tokens >= 0),
  cost_usd           numeric(12, 6) not null default 0 check (cost_usd >= 0),
  external_credits   integer not null default 0 check (external_credits >= 0)
);

create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

create or replace function public.record_ai_usage(
  p_function_name      text,
  p_model              text,
  p_environment        text,
  p_input_tokens       integer,
  p_output_tokens      integer,
  p_cache_read_tokens  integer,
  p_cache_write_tokens integer,
  p_cost_usd           numeric,
  p_external_credits   integer
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ai_usage (
    function_name, model, environment, input_tokens, output_tokens,
    cache_read_tokens, cache_write_tokens, cost_usd, external_credits
  ) values (
    p_function_name, p_model, p_environment, p_input_tokens, p_output_tokens,
    p_cache_read_tokens, p_cache_write_tokens, p_cost_usd, p_external_credits
  );
$$;

create or replace function public.ai_spend_total()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(cost_usd), 0) from public.ai_usage;
$$;

-- Devuelve filas vacías a quien no es administrador: el gasto por función es del portal.
create or replace function public.ai_usage_summary()
returns table (function_name text, calls bigint, cost_usd numeric, external_credits bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select u.function_name, count(*), coalesce(sum(u.cost_usd), 0), coalesce(sum(u.external_credits), 0)
  from public.ai_usage u
  where private.is_admin()
  group by u.function_name
  order by u.function_name;
$$;

revoke all on function public.record_ai_usage(text, text, text, integer, integer, integer, integer, numeric, integer) from public, anon;
revoke all on function public.ai_spend_total() from public, anon;
revoke all on function public.ai_usage_summary() from public, anon;

grant execute on function public.record_ai_usage(text, text, text, integer, integer, integer, integer, numeric, integer) to authenticated;
grant execute on function public.ai_spend_total() to authenticated;
grant execute on function public.ai_usage_summary() to authenticated;
