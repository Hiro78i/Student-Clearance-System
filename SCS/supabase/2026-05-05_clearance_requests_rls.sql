-- Enable operational access to clearance requests and workflow steps.
-- This allows:
-- - students to create and read their own requests
-- - office/registrar staff to see requests routed to their office and update their steps
-- - admins to read and manage all requests

create or replace function public.current_user_office_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select office_id
  from public.profiles
  where id = auth.uid()
$$;

grant execute on function public.current_user_office_id() to authenticated;

-- Helper access checks using SECURITY DEFINER to avoid RLS policy recursion.
create or replace function public.can_access_clearance_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clearance_requests request
    where request.id = target_request_id
      and (
        public.is_admin()
        or request.student_id = auth.uid()
        or exists (
          select 1
          from public.clearance_request_steps step
          where step.request_id = request.id
            and step.office_id = public.current_user_office_id()
        )
      )
  )
$$;

grant execute on function public.can_access_clearance_request(uuid) to authenticated;

create or replace function public.can_access_clearance_step(
  step_request_id uuid,
  step_office_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or step_office_id = public.current_user_office_id()
    or exists (
      select 1
      from public.clearance_requests request
      where request.id = step_request_id
        and request.student_id = auth.uid()
    )
$$;

grant execute on function public.can_access_clearance_step(uuid, uuid) to authenticated;

-- Keep profiles read policy simple to avoid cross-table RLS recursion.
-- Office/admin screens need profile lookups (student names, numbers), so
-- authenticated read access is enabled here.
drop policy if exists "profiles_office_related_read" on public.profiles;
drop policy if exists "profiles_authenticated_read_all" on public.profiles;
create policy "profiles_authenticated_read_all"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "clearance_requests_student_read_own" on public.clearance_requests;
drop policy if exists "clearance_requests_student_insert_own" on public.clearance_requests;
drop policy if exists "clearance_requests_student_update_own" on public.clearance_requests;
drop policy if exists "clearance_requests_admin_read_all" on public.clearance_requests;
drop policy if exists "clearance_requests_admin_update_all" on public.clearance_requests;
drop policy if exists "clearance_requests_admin_delete_all" on public.clearance_requests;
drop policy if exists "clearance_requests_office_read_assigned" on public.clearance_requests;
drop policy if exists "clearance_requests_office_update_assigned" on public.clearance_requests;

create policy "clearance_requests_student_read_own"
on public.clearance_requests
for select
to authenticated
using (public.can_access_clearance_request(id));

create policy "clearance_requests_student_insert_own"
on public.clearance_requests
for insert
to authenticated
with check (student_id = auth.uid());

create policy "clearance_requests_student_update_own"
on public.clearance_requests
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "clearance_requests_admin_read_all"
on public.clearance_requests
for select
to authenticated
using (public.is_admin());

create policy "clearance_requests_admin_update_all"
on public.clearance_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "clearance_requests_admin_delete_all"
on public.clearance_requests
for delete
to authenticated
using (public.is_admin());

create policy "clearance_requests_office_read_assigned"
on public.clearance_requests
for select
to authenticated
using (public.can_access_clearance_request(id));

create policy "clearance_requests_office_update_assigned"
on public.clearance_requests
for update
to authenticated
using (public.can_access_clearance_request(id))
with check (public.can_access_clearance_request(id));

drop policy if exists "clearance_steps_student_read_own" on public.clearance_request_steps;
drop policy if exists "clearance_steps_student_insert_own_request" on public.clearance_request_steps;
drop policy if exists "clearance_steps_office_read_assigned" on public.clearance_request_steps;
drop policy if exists "clearance_steps_office_update_assigned" on public.clearance_request_steps;
drop policy if exists "clearance_steps_admin_read_all" on public.clearance_request_steps;
drop policy if exists "clearance_steps_admin_insert_all" on public.clearance_request_steps;
drop policy if exists "clearance_steps_admin_update_all" on public.clearance_request_steps;
drop policy if exists "clearance_steps_admin_delete_all" on public.clearance_request_steps;

create policy "clearance_steps_student_read_own"
on public.clearance_request_steps
for select
to authenticated
using (public.can_access_clearance_step(request_id, office_id));

create policy "clearance_steps_student_insert_own_request"
on public.clearance_request_steps
for insert
to authenticated
with check (
  public.is_admin()
  or public.can_access_clearance_request(request_id)
);

create policy "clearance_steps_office_read_assigned"
on public.clearance_request_steps
for select
to authenticated
using (public.can_access_clearance_step(request_id, office_id));

create policy "clearance_steps_office_update_assigned"
on public.clearance_request_steps
for update
to authenticated
using (public.can_access_clearance_step(request_id, office_id))
with check (public.can_access_clearance_step(request_id, office_id));

create policy "clearance_steps_admin_read_all"
on public.clearance_request_steps
for select
to authenticated
using (public.is_admin());

create policy "clearance_steps_admin_insert_all"
on public.clearance_request_steps
for insert
to authenticated
with check (public.is_admin());

create policy "clearance_steps_admin_update_all"
on public.clearance_request_steps
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "clearance_steps_admin_delete_all"
on public.clearance_request_steps
for delete
to authenticated
using (public.is_admin());
