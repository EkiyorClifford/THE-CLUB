-- Minimal member profile. Match, rating, and invitation tables are intentionally absent.
-- Profile rows are created only when Auth provisions a user. Members cannot insert rows.

create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 1 and 80)
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant select (id, display_name, created_at, updated_at) on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function private.set_profile_updated_at();

-- Runs as the table owner when Auth inserts a user. Not callable as an API.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen text;
begin
  -- Presentation only. Identity remains new.id. char_length and left both count characters.
  chosen := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if chosen is null then
    chosen := nullif(btrim(split_part(coalesce(new.email, ''), '@', 1)), '');
  end if;
  if chosen is null then
    chosen := 'Member';
  end if;
  chosen := left(chosen, 80);
  if chosen is null or btrim(chosen) = '' then
    chosen := 'Member';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, chosen);
  return new;
end;
$$;

-- EXECUTE is required to create these triggers. PostgreSQL does not grant it to
-- authenticated here: firing an existing trigger is not a direct function call,
-- and these routines must not be general RPCs.
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_profile_updated_at() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();
