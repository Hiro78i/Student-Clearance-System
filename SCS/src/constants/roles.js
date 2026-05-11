export const ROLES = {
  STUDENT: 'student',
  OFFICE: 'office',
  REGISTRAR: 'registrar',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.OFFICE]: 'College Office Staff',
  [ROLES.REGISTRAR]: 'Registrar Office',
  [ROLES.ADMIN]: 'System Administrator',
}

export const rolesData = [
  { id: 'role-student', name: ROLES.STUDENT, label: ROLE_LABELS[ROLES.STUDENT] },
  { id: 'role-office', name: ROLES.OFFICE, label: ROLE_LABELS[ROLES.OFFICE] },
  { id: 'role-registrar', name: ROLES.REGISTRAR, label: ROLE_LABELS[ROLES.REGISTRAR] },
  { id: 'role-admin', name: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
]

export const REQUEST_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
}

export const STEP_STATUS = {
  PENDING: 'Pending',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned for Correction',
  NOT_APPLICABLE: 'Not Applicable',
}

export const roleHome = {
  [ROLES.STUDENT]: '/student/dashboard',
  [ROLES.OFFICE]: '/office/dashboard',
  [ROLES.REGISTRAR]: '/registrar/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
}

export function resolveProfileRole(profile) {
  if (!profile) return ''
  if (profile.role && Object.values(ROLES).includes(profile.role)) return profile.role

  const normalizedLabel = (profile.role_label || '').trim().toLowerCase()
  if (normalizedLabel === 'student') return ROLES.STUDENT
  if (normalizedLabel === 'college office staff') return ROLES.OFFICE
  if (normalizedLabel === 'registrar office') return ROLES.REGISTRAR
  if (normalizedLabel === 'system administrator') return ROLES.ADMIN

  // Fallback for legacy rows with missing role_id/role join.
  const normalizedEmail = (profile.email || '').toLowerCase()
  const normalizedName = (profile.full_name || '').toLowerCase()

  if (
    normalizedEmail.startsWith('admin') ||
    normalizedName.includes('system admin') ||
    normalizedName.includes('administrator')
  ) {
    return ROLES.ADMIN
  }

  if (profile.office_id) return ROLES.OFFICE
  if (profile.student_no || profile.course || profile.year_level) return ROLES.STUDENT
  if (!profile.office_id) return ROLES.STUDENT

  return ''
}

export function needsOfficeAssignment(profile) {
  return resolveProfileRole(profile) === ROLES.OFFICE && !profile?.office_id
}

export function resolveHomePath(profile) {
  const role = resolveProfileRole(profile)
  if (!role) return '/setup-pending'
  if (needsOfficeAssignment(profile)) return '/setup-pending'
  return roleHome[role] || '/setup-pending'
}

export function canReviewOffice(profile, officeId) {
  if (!profile) return false
  if (profile.role === ROLES.ADMIN) return true
  if (profile.role === ROLES.REGISTRAR) return true
  return profile.role === ROLES.OFFICE && profile.office_id === officeId
}
