-- Harden public.claim_listing_job by setting a deterministic search_path.
-- We don't assume the argument signature; we update every overload found.
-- Safe to run multiple times.

do $$
declare
  r record;
begin
  for r in
    select
      p.oid,
      n.nspname as schema_name,
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_listing_job'
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public;',
      r.schema_name,
      r.func_name,
      r.args
    );
  end loop;
end $$;


