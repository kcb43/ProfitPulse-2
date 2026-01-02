-- Harden SECURITY DEFINER trigger function to use a deterministic search_path
-- and reduce risk of search_path hijacking.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_profiles (id, username, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    insert into public.user_profiles (id, username, first_name, last_name)
    values (
      new.id,
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8),
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name'
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

-- Lock down execute privileges: this should primarily be used as a trigger.
do $$
begin
  execute 'revoke all on function public.handle_new_user() from public';
exception when others then null;
end $$;

do $$
begin
  -- Supabase typically uses this role to manage auth triggers.
  execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
exception when others then null;
end $$;


