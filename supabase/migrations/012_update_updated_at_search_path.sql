-- Harden update_updated_at_column trigger function with a deterministic search_path.
-- This avoids search_path hijacking and makes behavior consistent.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;


