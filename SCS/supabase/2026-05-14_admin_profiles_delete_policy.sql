-- Allow system administrators to delete profile rows from User Management.
-- Auth user deletion should still be handled by the admin-create-user edge function
-- when deployed; this policy allows the app to remove the profile record as a fallback.

drop policy if exists "profiles_admin_delete_all" on public.profiles;

create policy "profiles_admin_delete_all"
on public.profiles
for delete
to authenticated
using (public.is_admin() and id <> auth.uid());
