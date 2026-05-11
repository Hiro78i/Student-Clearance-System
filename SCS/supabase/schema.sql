-- Cloud-Based Student Clearance Management System schema
-- Run this in Supabase SQL editor, then enable Row Level Security policies.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.offices (
  id uuid primary key default gen_random_uuid(),
  office_name text not null unique,
  description text,
  order_no integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  abbreviation text not null,
  category text not null check (category in ('4-year', '2-year', 'graduate')),
  duration_label text not null,
  department text not null,
  majors text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title, abbreviation)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  student_no text,
  course text,
  year_level text,
  graduation_term text,
  role_id uuid references public.roles(id),
  office_id uuid references public.offices(id),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.clearance_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  clearance_type text not null default 'Graduation Clearance',
  purpose text,
  status text not null default 'Submitted',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clearance_request_steps (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.clearance_requests(id) on delete cascade,
  office_id uuid not null references public.offices(id),
  status text not null default 'Pending',
  remarks text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  order_no integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.request_remarks (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.clearance_requests(id) on delete cascade,
  office_id uuid references public.offices(id),
  remarks text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  module text not null,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clearance_requests_student
  on public.clearance_requests(student_id);

create index if not exists idx_courses_category
  on public.courses(category);

create index if not exists idx_clearance_steps_request
  on public.clearance_request_steps(request_id);

create index if not exists idx_clearance_steps_office
  on public.clearance_request_steps(office_id);

create index if not exists idx_notifications_user
  on public.notifications(user_id, is_read);

alter table public.roles enable row level security;
alter table public.offices enable row level security;
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.clearance_requests enable row level security;
alter table public.clearance_request_steps enable row level security;
alter table public.request_remarks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "courses_public_read" on public.courses;
drop policy if exists "courses_authenticated_insert" on public.courses;
drop policy if exists "courses_authenticated_update" on public.courses;
drop policy if exists "courses_authenticated_delete" on public.courses;

create policy "courses_public_read"
on public.courses
for select
to anon, authenticated
using (true);

create policy "courses_authenticated_insert"
on public.courses
for insert
to authenticated
with check (true);

create policy "courses_authenticated_update"
on public.courses
for update
to authenticated
using (true)
with check (true);

create policy "courses_authenticated_delete"
on public.courses
for delete
to authenticated
using (true);

-- Suggested RLS direction:
-- students: read/update own profile, create/read own requests
-- office staff: read requests routed to their office, update their assigned steps
-- registrar: read student records and registrar steps
-- admin: full access to operational tables
