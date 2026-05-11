import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const labels = {
  student: 'Student',
  office: 'Office',
  registrar: 'Registrar',
  admin: 'Admin',
  dashboard: 'Dashboard',
  'submit-clearance': 'Submit Clearance',
  'clearance-status': 'Clearance Status',
  clearance: 'Clearance',
  notifications: 'Notifications',
  profile: 'Profile',
  'review-requests': 'Review Requests',
  requests: 'Requests',
  queue: 'Queue',
  reports: 'Reports',
  users: 'Users',
  roles: 'Roles',
  offices: 'Offices',
  workflow: 'Workflow',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  'academic-verification': 'Academic Verification',
  'student-records': 'Student Records',
  'clearance-decision': 'Clearance Decision',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500"
    >
      <Link className="inline-flex items-center gap-1 hover:text-blue-700" to="/">
        <Home className="h-3.5 w-3.5" />
        Home
      </Link>
      {parts.map((part, index) => {
        const to = `/${parts.slice(0, index + 1).join('/')}`
        const isLast = index === parts.length - 1
        const label = labels[part] || part

        return (
          <span className="inline-flex items-center gap-1" key={to}>
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-slate-700">{label}</span>
            ) : (
              <Link className="hover:text-blue-700" to={to}>
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
