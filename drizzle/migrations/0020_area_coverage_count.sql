-- Honest coverage check for the homeowner brief flow: how many verified,
-- non-test trades actually cover a postcode area right now.
create or replace function public.area_coverage(_postcode text, _trade_type text default null)
returns json
language sql
stable
security definer
set search_path = public
as $$
  with letters as (
    select coalesce((regexp_match(upper(regexp_replace(coalesce(_postcode,''), '\s', '', 'g')), '^([A-Z]{1,2})'))[1], '') as pc
  ), live as (
    select t.trade_type,
           coalesce((regexp_match(upper(regexp_replace(coalesce(t.postcode,''), '\s', '', 'g')), '^([A-Z]{1,2})'))[1], '') as pc
    from public.trades t
    where t.verified = true and coalesce(t.is_test, false) = false
  )
  select json_build_object(
    'area', (select pc from letters),
    'area_trades', (select count(*) from live where (select pc from letters) <> '' and live.pc = (select pc from letters)),
    'trade_matches', (select count(*) from live
                      where (select pc from letters) <> '' and live.pc = (select pc from letters)
                        and (_trade_type is null or lower(live.trade_type) = lower(_trade_type))),
    'total_verified', (select count(*) from live)
  );
$$;

revoke all on function public.area_coverage(text, text) from public;
grant execute on function public.area_coverage(text, text) to anon, authenticated, service_role;