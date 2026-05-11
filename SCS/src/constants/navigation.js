import { ROLES } from './roles'

export const navigationGroups = [
  {
    label: 'Portal',
    items: [
      {
        title: 'Home Dashboard',
        icon: 'LayoutDashboard',
        paths: {
          [ROLES.STUDENT]: '/student/dashboard',
          [ROLES.OFFICE]: '/office/dashboard',
          [ROLES.REGISTRAR]: '/registrar/dashboard',
          [ROLES.ADMIN]: '/admin/dashboard',
        },
        roles: [ROLES.STUDENT, ROLES.OFFICE, ROLES.REGISTRAR, ROLES.ADMIN],
      },
      {
        title: 'Clearances',
        icon: 'BadgeCheck',
        path: '/admin/clearances',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Clearance Application',
        icon: 'Send',
        path: '/student/submit-clearance',
        roles: [ROLES.STUDENT],
      },
      {
        title: 'My Clearance Status',
        icon: 'ListChecks',
        path: '/student/clearance-status',
        roles: [ROLES.STUDENT],
      },
      {
        title: 'Clearance Reviews',
        icon: 'ClipboardCheck',
        path: '/office/review-requests',
        roles: [ROLES.OFFICE],
      },
      {
        title: 'Office Review Queue',
        icon: 'Rows3',
        path: '/office/queue',
        roles: [ROLES.OFFICE],
      },
      {
        title: 'Academic Verification',
        icon: 'GraduationCap',
        path: '/registrar/academic-verification',
        roles: [ROLES.REGISTRAR],
      },
      {
        title: 'Student Records Validation',
        icon: 'FileSearch',
        path: '/registrar/student-records',
        roles: [ROLES.REGISTRAR],
      },
      {
        title: 'Final Clearance Decision',
        icon: 'BadgeCheck',
        path: '/registrar/clearance-decision',
        roles: [ROLES.REGISTRAR],
      },
    ],
  },
  {
    label: 'Institution Management',
    items: [
      {
        title: 'Student & Staff Accounts',
        icon: 'Users',
        path: '/admin/users',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Access Roles',
        icon: 'ShieldCheck',
        path: '/admin/roles',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'College Offices',
        icon: 'Building2',
        path: '/admin/offices',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Courses',
        icon: 'BookOpenText',
        path: '/admin/courses',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Clearance Workflow',
        icon: 'Workflow',
        path: '/admin/workflow',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Audit Trail',
        icon: 'History',
        path: '/admin/audit-logs',
        roles: [ROLES.ADMIN],
      },
    ],
  },
  {
    label: 'Records',
    items: [
      {
        title: 'Office Reports',
        icon: 'BarChart3',
        path: '/office/reports',
        roles: [ROLES.OFFICE],
      },
      {
        title: 'Institutional Reports',
        icon: 'BarChart3',
        paths: {
          [ROLES.REGISTRAR]: '/registrar/reports',
          [ROLES.ADMIN]: '/admin/reports',
        },
        roles: [ROLES.REGISTRAR, ROLES.ADMIN],
      },
      {
        title: 'Report Data',
        icon: 'Table2',
        path: '/admin/report-data',
        roles: [ROLES.ADMIN],
      },
      {
        title: 'Notifications',
        icon: 'Bell',
        paths: {
          [ROLES.STUDENT]: '/student/notifications',
          [ROLES.OFFICE]: '/office/notifications',
          [ROLES.REGISTRAR]: '/registrar/notifications',
          [ROLES.ADMIN]: '/admin/notifications',
        },
        roles: [ROLES.STUDENT, ROLES.OFFICE, ROLES.REGISTRAR, ROLES.ADMIN],
      },
      {
        title: 'My Student Profile',
        icon: 'UserRound',
        path: '/student/profile',
        roles: [ROLES.STUDENT],
      },
      {
        title: 'My Profile',
        icon: 'UserRound',
        path: '/office/profile',
        roles: [ROLES.OFFICE],
      },
    ],
  },
]

export const notificationsPathByRole = {
  [ROLES.STUDENT]: '/student/notifications',
  [ROLES.OFFICE]: '/office/notifications',
  [ROLES.REGISTRAR]: '/registrar/notifications',
  [ROLES.ADMIN]: '/admin/notifications',
}

export function resolveNavigationPath(item, role) {
  if (item.path) return item.path
  return item.paths?.[role] || '/'
}
