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

create index if not exists idx_courses_category
  on public.courses(category);

alter table public.courses enable row level security;

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

insert into public.courses (title, abbreviation, category, duration_label, department, majors)
values
  ('BS in Accountancy', 'B.S.A.', '4-year', '4 Years', 'College of Business and Accountancy', '{}'),
  ('BS in Business Administration', 'B.S.B.A.', '4-year', '4 Years', 'College of Business and Accountancy', '{"Operations Management","Financial Management"}'),
  ('Bachelor of Science in Criminology', 'B.S. Crim.', '4-year', '4 Years', 'College of Criminal Justice Education', '{}'),
  ('Bachelor of Science in Entrepreneurship', 'B.S. Entrep.', '4-year', '4 Years', 'College of Business and Accountancy', '{}'),
  ('Bachelor of Science in Nursing', 'B.S.N.', '4-year', '4 Years', 'College of Nursing', '{}'),
  ('Bachelor of Arts in Communication', 'B.A. Comm', '4-year', '4 Years', 'College of Arts and Sciences', '{}'),
  ('Bachelor in Secondary Education', 'B.S.Ed.', '4-year', '4 Years', 'College of Education', '{"English","Mathematics","Filipino","MAPEH","Social Studies"}'),
  ('Bachelor of Science in Computer Science', 'B.S.C.S.', '4-year', '4 Years', 'College of Computer Studies', '{}'),
  ('Bachelor in Elementary Education', 'B.E.Ed.', '4-year', '4 Years', 'College of Education', '{"Content Course","Special Education","Pre-School Education"}'),
  ('Bachelor of Early Childhood Education', 'B.E.C.Ed', '4-year', '4 Years', 'College of Education', '{}'),
  ('Bachelor of Special Needs Education', 'B.S.N.Ed', '4-year', '4 Years', 'College of Education', '{}'),
  ('Bachelor of Culture and Arts Education', 'B.C.A.Ed', '4-year', '4 Years', 'College of Education', '{}'),
  ('Bachelor of Physical Education', 'B.P.Ed.', '4-year', '4 Years', 'College of Education', '{}'),
  ('Diploma in Midwifery', 'DM', '2-year', '2 Years', 'College of Allied Health', '{}'),
  ('Master of Arts in Education', 'M.A.Ed.', 'graduate', 'Graduate Program', 'Graduate School', '{"Educational Leadership","Special Education"}')
on conflict (title, abbreviation) do update
set
  category = excluded.category,
  duration_label = excluded.duration_label,
  department = excluded.department,
  majors = excluded.majors,
  updated_at = now();
