-- Enables self-registration for office staff accounts.
-- Office staff profiles are created without office_id so admins can assign
-- the correct office later from the admin tools.

insert into public.roles (name, label)
values
  ('student', 'Student'),
  ('office', 'College Office Staff'),
  ('registrar', 'Registrar Office'),
  ('admin', 'System Administrator')
on conflict (name) do update
set label = excluded.label;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role_name text;
  resolved_role_id uuid;
begin
  requested_role_name := lower(
    coalesce(
      nullif(new.raw_user_meta_data ->> 'role', ''),
      nullif(new.raw_user_meta_data ->> 'account_type', ''),
      'student'
    )
  );

  if requested_role_name not in ('student', 'office', 'registrar', 'admin') then
    requested_role_name := 'student';
  end if;

  select id into resolved_role_id
  from public.roles
  where name = requested_role_name
  limit 1;

  insert into public.profiles (
    id,
    full_name,
    email,
    first_name,
    middle_name,
    last_name,
    suffix,
    sex,
    date_of_birth,
    address,
    contact_number,
    student_no,
    course,
    year_level,
    graduation_term,
    department_college,
    section,
    role_id,
    office_id,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'middle_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'suffix',
    new.raw_user_meta_data ->> 'sex',
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date,
    new.raw_user_meta_data ->> 'address',
    new.raw_user_meta_data ->> 'contact_number',
    case
      when requested_role_name = 'student' then new.raw_user_meta_data ->> 'student_no'
      else null
    end,
    case
      when requested_role_name = 'student' then new.raw_user_meta_data ->> 'course'
      else null
    end,
    case
      when requested_role_name = 'student' then new.raw_user_meta_data ->> 'year_level'
      else null
    end,
    null,
    case
      when requested_role_name = 'student' then new.raw_user_meta_data ->> 'department_college'
      else null
    end,
    case
      when requested_role_name = 'student' then new.raw_user_meta_data ->> 'section'
      else null
    end,
    resolved_role_id,
    null,
    null
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    first_name = excluded.first_name,
    middle_name = excluded.middle_name,
    last_name = excluded.last_name,
    suffix = excluded.suffix,
    sex = excluded.sex,
    date_of_birth = excluded.date_of_birth,
    address = excluded.address,
    contact_number = excluded.contact_number,
    student_no = excluded.student_no,
    course = excluded.course,
    year_level = excluded.year_level,
    graduation_term = excluded.graduation_term,
    department_college = excluded.department_college,
    section = excluded.section,
    role_id = excluded.role_id,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
