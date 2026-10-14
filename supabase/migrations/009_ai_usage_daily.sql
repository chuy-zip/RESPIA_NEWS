-- Historial de consumo para administradores (RP-01, RP-02).
-- Aplicar solo después de que el PR llegue a main. No cambia la tabla ni el tope de gasto.

create or replace function public.ai_usage_daily(p_days integer)
returns table (
  date date,
  calls bigint,
  cost_usd numeric,
  input_tokens bigint,
  output_tokens bigint,
  cache_read_tokens bigint,
  cache_write_tokens bigint,
  external_credits bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'America/Guatemala')::date;
begin
  if not coalesce(private.is_admin(), false) then
    raise exception 'Solo los administradores pueden consultar el historial de consumo.' using errcode = '42501';
  end if;
  if p_days is null or p_days not in (7, 30, 90) then
    raise exception 'El período debe ser de 7, 30 o 90 días.' using errcode = '22023';
  end if;

  return query
  with days as (
    select today - offsets.day_offset as day
    from generate_series(0, p_days - 1) as offsets(day_offset)
  ), totals as (
    select
      (u.created_at at time zone 'America/Guatemala')::date as day,
      count(*) as calls,
      sum(u.cost_usd) as cost_usd,
      sum(u.input_tokens) as input_tokens,
      sum(u.output_tokens) as output_tokens,
      sum(u.cache_read_tokens) as cache_read_tokens,
      sum(u.cache_write_tokens) as cache_write_tokens,
      sum(u.external_credits) as external_credits
    from public.ai_usage as u
    where u.created_at >= ((today - (p_days - 1))::timestamp at time zone 'America/Guatemala')
      and u.created_at <= now()
    group by (u.created_at at time zone 'America/Guatemala')::date
  )
  select
    d.day,
    coalesce(t.calls, 0::bigint),
    coalesce(t.cost_usd, 0::numeric),
    coalesce(t.input_tokens, 0::bigint),
    coalesce(t.output_tokens, 0::bigint),
    coalesce(t.cache_read_tokens, 0::bigint),
    coalesce(t.cache_write_tokens, 0::bigint),
    coalesce(t.external_credits, 0::bigint)
  from days as d
  left join totals as t on t.day = d.day
  order by d.day;
end;
$$;

revoke all on function public.ai_usage_daily(integer) from public, anon, authenticated;
grant execute on function public.ai_usage_daily(integer) to authenticated;
