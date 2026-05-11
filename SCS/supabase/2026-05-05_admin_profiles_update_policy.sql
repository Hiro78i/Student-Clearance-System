-- Allow system administrators to update any profile record.
-- Needed for assigning office staff accounts to offices from admin screens.

drop policy if exists "profiles_admin_update_all" on public.profiles;

create policy "profiles_admin_update_all"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
