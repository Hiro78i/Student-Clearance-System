-- Fast, persistent User Management delete fallback.
-- This removes a profile row from public.profiles after cleaning references that
-- can block deletion. It intentionally prevents deleting the currently signed-in
-- admin profile.

create or replace function public.admin_delete_profile(target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only system administrators can delete profiles.';
  end if;

  if target_profile_id = auth.uid() then
    raise exception 'You cannot delete your current signed-in account.';
  end if;

  update public.clearance_request_steps
  set reviewed_by = null
  where reviewed_by = target_profile_id;

  update public.request_remarks
  set created_by = null
  where created_by = target_profile_id;

  update public.audit_logs
  set user_id = null
  where user_id = target_profile_id;

  delete from public.profiles
  where id = target_profile_id;
end;
$$;

grant execute on function public.admin_delete_profile(uuid) to authenticated;
