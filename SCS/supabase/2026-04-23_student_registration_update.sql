-- Student registration update for the Cloud-Based Student Clearance Management System.
-- Run this in Supabase SQL Editor after the base schema.sql.
-- Student number format: exactly 6 digits, e.g. 142020.

create extension if not exists pgcrypto;

-- 1) Ensure roles needed by the application exist.
insert into public.roles (name, label)
values
  ('student', 'Student'),
  ('office', 'College Office Staff'),
  ('registrar', 'Registrar Office'),
  ('admin', 'System Administrator')
on conflict (name) do update
set label = excluded.label;

-- 2) Ensure core offices exist.
insert into public.offices (office_name, description, order_no)
values
  ('Library', 'Validates borrowed materials and library obligations.', 1),
  ('Accounting', 'Checks financial balances, graduation fees, and payments.', 2),
  ('Department/Dean', 'Confirms department requirements, exits, and endorsements.', 3),
  ('Registrar', 'Performs final academic verification and completion release.', 4)
on conflict (office_name) do update
set
  description = excluded.description,
  order_no = excluded.order_no;

-- 3) Add registration fields to profiles.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists suffix text,
  add column if not exists sex text,
  add column if not exists date_of_birth date,
  add column if not exists address text,
  add column if not exists contact_number text,
  add column if not exists department_college text,
  add column if not exists section text,
  add column if not exists updated_at timestamptz not null default now();

-- 4) Normalize existing sample-style student numbers before adding constraints.
-- Example: STU-2026-0142 becomes 202614 if you have old demo rows.
-- You may instead manually update these rows to your real 6-digit format before running constraints.
update public.profiles
set student_no = regexp_replace(student_no, '\D', '', 'g')
where student_no is not null
  and student_no <> ''
  and student_no !~ '^\d{6}$';

-- 5) Student number must be unique when provided and must be exactly 6 digits.
create unique index if not exists profiles_student_no_unique
  on public.profiles (student_no)
  where student_no is not null and student_no <> '';

alter table public.profiles
  drop constraint if exists profiles_student_no_format;

alter table public.profiles
  add constraint profiles_student_no_format
  check (
    student_no is null
    or student_no = ''
    or student_no ~ '^\d{6}$'
  );

alter table public.profiles
  drop constraint if exists profiles_sex_values;

alter table public.profiles
  add constraint profiles_sex_values
  check (
    sex is null
    or sex in ('Female', 'Male')
  );

-- 6) Helper RPC for login with student number.
-- The client can call this with a 6-digit student number, get the email, then use Supabase Auth signInWithPassword.
create or replace function public.get_email_by_student_no(student_number text)
returns text
language sql
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where student_no = student_number
  limit 1;
$$;

grant execute on function public.get_email_by_student_no(text) to anon, authenticated;

-- 7) Automatically create a student profile after Supabase Auth signup.
-- This expects registration metadata keys from the React form:
-- first_name, middle_name, last_name, suffix, sex, date_of_birth, address,
-- contact_number, student_no, course, year_level, department_college, section.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_role_id uuid;
begin
  select id into student_role_id
  from public.roles
  where name = 'student'
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
    new.raw_user_meta_data ->> 'student_no',
    new.raw_user_meta_data ->> 'course',
    new.raw_user_meta_data ->> 'year_level',
    new.raw_user_meta_data ->> 'graduation_term',
    new.raw_user_meta_data ->> 'department_college',
    new.raw_user_meta_data ->> 'section',
    student_role_id,
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
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8) Basic RLS policies for profile registration/login testing.
-- Tighten these later for production by checking roles and office assignments.
drop policy if exists "profiles_select_own_or_student_lookup" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own_or_student_lookup"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
