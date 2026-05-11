-- Mabini Colleges digital clearance workflow update.
-- Run after schema.sql and 2026-04-23_student_registration_update.sql.
-- Converts the paper clearance form into a multi-office approval workflow.

-- 1) Replace/ensure the Mabini clearance offices used by the digital workflow.
insert into public.offices (office_name, description, order_no)
values
  ('Guidance', 'Reviews student conduct, counseling records, and guidance clearances.', 1),
  ('College Library', 'Validates borrowed college library materials and library obligations.', 2),
  ('Property Custodian', 'Checks returned school property, equipment, and issued materials.', 3),
  ('Dean/Principal', 'Confirms department or school-level requirements and endorsements.', 4),
  ('Accounting Section', 'Checks balances, fees, assessments, and financial obligations.', 5),
  ('High School Library', 'Marks high school library clearance when applicable.', 6),
  ('MA Library', 'Marks graduate school library clearance when applicable.', 7),
  ('College Laboratory', 'Reviews laboratory equipment, tools, and facility obligations.', 8),
  ('Registrar', 'Performs final academic verification and completion release.', 9),
  ('Student Council', 'Confirms student organization and council obligations when required.', 10)
on conflict (office_name) do update
set
  description = excluded.description,
  order_no = excluded.order_no;

-- 2) Store the student/request fields from the physical clearance form.
alter table public.clearance_requests
  add column if not exists request_date date,
  add column if not exists address text,
  add column if not exists contact_number text,
  add column if not exists semester text,
  add column if not exists school_year text,
  add column if not exists requested_documents text[] not null default '{}',
  add column if not exists other_document text,
  add column if not exists finalized_by uuid references public.profiles(id),
  add column if not exists finalized_at timestamptz;

alter table public.clearance_requests
  alter column clearance_type set default 'Mabini Colleges Clearance Request';

-- 3) Support digital approval logs per office step.
alter table public.clearance_request_steps
  add column if not exists digital_approval_log jsonb not null default '[]'::jsonb;

-- 4) Office step status values for workflow-based clearance.
alter table public.clearance_request_steps
  drop constraint if exists clearance_request_steps_status_check;

alter table public.clearance_request_steps
  add constraint clearance_request_steps_status_check
  check (
    status in (
      'Pending',
      'In Review',
      'Approved',
      'Rejected',
      'Returned for Correction',
      'Not Applicable'
    )
  );

-- 5) Request status values used by dashboards and final clearance release.
alter table public.clearance_requests
  drop constraint if exists clearance_requests_status_check;

alter table public.clearance_requests
  add constraint clearance_requests_status_check
  check (
    status in (
      'Draft',
      'Submitted',
      'In Review',
      'Approved',
      'Rejected',
      'Completed'
    )
  );

-- 6) Document request validation. Use "Others" only when other_document is provided.
alter table public.clearance_requests
  drop constraint if exists clearance_requests_other_document_check;

alter table public.clearance_requests
  add constraint clearance_requests_other_document_check
  check (
    not ('Others' = any(requested_documents))
    or nullif(trim(other_document), '') is not null
  );
