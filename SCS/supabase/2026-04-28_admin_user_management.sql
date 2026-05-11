alter table public.offices
  add column if not exists is_required boolean not null default true;

insert into public.roles (name, label)
values
  ('student', 'Student'),
  ('office', 'College Office Staff'),
  ('registrar', 'Registrar Office'),
  ('admin', 'System Administrator')
on conflict (name) do update
set label = excluded.label;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.roles role_record on role_record.id = profile.role_id
    where profile.id = auth.uid()
      and role_record.name = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "roles_authenticated_read" on public.roles;
drop policy if exists "offices_authenticated_read" on public.offices;
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_read_all" on public.profiles;

create policy "roles_authenticated_read"
on public.roles
for select
to authenticated
using (true);

create policy "offices_authenticated_read"
on public.offices
for select
to authenticated
using (true);

create policy "profiles_self_read"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_admin_read_all"
on public.profiles
for select
to authenticated
using (public.is_admin());
