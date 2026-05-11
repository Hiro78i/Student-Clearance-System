# Student Clearance System (SCS)

A role-based web system for managing student clearance requests and office approvals.

## User Roles Covered in This Guide

- `Admin`: Sets up the system, manages users/offices/workflow, and oversees all requests.
- `Student`: Creates and tracks clearance requests.
- `Office Staff`: Reviews requests assigned to their office and records decisions.

## Accessing the System

1. Open the app URL
2. Sign in from `/login` using your assigned account.
3. You are automatically redirected to your role dashboard:
- Student: `/student/dashboard`
- Office Staff: `/office/dashboard`
- Admin: `/admin/dashboard`

## Admin Guide

### A. First-Time Setup (Recommended Order)

1. Go to `College Offices` (`/admin/offices`)
- Add or edit offices.
- Assign office accounts where needed.
- Confirm workflow order numbers are correct.

2. Go to `Clearance Workflow` (`/admin/workflow`)
- Reorder offices by drag-and-drop.
- Mark each office step as `Required` or `Optional`.
- Save workflow settings.

3. Go to `Student & Staff Accounts` (`/admin/users`)
- Create student and staff accounts.
- Edit profile details.
- Reset/change passwords when needed.

4. (Optional) Go to `Courses` (`/admin/courses`)
- Maintain available course/program options.

### B. Daily Operations

1. Go to `Clearances` (`/admin/clearances`)
- Search by request ID, student name, or student number.
- Filter by status.
- Open request details with `View`.
- Use `Complete` only when admin-level forced completion is needed.
- Use `Delete` only when a request should be removed from admin clearance records.

2. Go to `Audit Trail` (`/admin/audit-logs`)
- Review user and workflow activity history.

3. Go to `Institutional Reports` / `Report Data`
- Monitor trends, clearance volumes, and status distribution.

## Student Guide

### A. Submit a New Clearance Request

1. Go to `Clearance Application` (`/student/submit-clearance`).
2. Complete required fields:
- Request date
- Address
- Contact number
- Purpose
- Semester and school year
- Requested documents/certifications
3. Review the office route shown in the workflow section.
4. Choose one of the actions:
- `Save Draft` to continue later.
- `Submit for Office Review` to start the approval workflow.

### B. Track Request Progress

1. Go to `My Clearance Status` (`/student/clearance-status`).
2. Open a specific request to view office-by-office progress.
3. Check decision remarks if any office approved/rejected/returned your request.
4. Monitor `Notifications` for updates.

### C. Manage Profile

1. Go to `My Student Profile` (`/student/profile`).
2. Keep personal and academic details accurate to avoid processing delays.

## Office Staff Guide

### A. Review Assigned Requests

1. Go to `Clearance Reviews` (`/office/review-requests`).
2. Filter by status/course/date or search by student/request info.
3. Open request details using `View`.

### B. Record Decisions

For each assigned step, available actions may include:
- `Review` (mark as in review)
- `Approve`
- `Reject`

When approving/rejecting, enter clear remarks for transparency.

### C. Monitor Queue and Reports

1. Go to `Office Review Queue` (`/office/queue`) for pending workload.
2. Go to `Office Reports` (`/office/reports`) for office-level reporting.
3. Check `Notifications` for routing updates and actions.

## Typical End-to-End Flow

1. Admin configures offices, workflow, and user accounts.
2. Student submits a clearance request.
3. Request routes through offices in configured order.
4. Office Staff review and decide per step.
5. Student tracks status and receives notifications until completion.
6. Admin monitors and intervenes only when needed.

## Troubleshooting

- If login succeeds but no pages load, confirm the account has a valid role assignment.
- If Office Staff cannot see requests, verify the account is linked to an office.
- If workflow appears wrong, Admin should recheck `Clearance Workflow` ordering and required flags.
- If students cannot submit, ensure required profile fields and request fields are complete.

## Quick Navigation

- Login: `/login`
- Admin dashboard: `/admin/dashboard`
- Student dashboard: `/student/dashboard`
- Office dashboard: `/office/dashboard`
