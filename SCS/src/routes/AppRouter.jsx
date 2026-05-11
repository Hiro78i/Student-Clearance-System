import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoadingState } from '@/components/shared/LoadingState'
import { ROLES } from '@/constants/roles'
import { AuthProvider } from '@/context/AuthContext'
import { ClearanceProvider } from '@/context/ClearanceContext'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRedirect } from './RoleRedirect'

function lazyNamed(factory, exportName) {
  return lazy(async () => {
    const module = await factory()
    return { default: module[exportName] }
  })
}

const LoginPage = lazyNamed(() => import('@/pages/auth/LoginPage'), 'LoginPage')
const RegisterPage = lazyNamed(() => import('@/pages/auth/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = lazyNamed(
  () => import('@/pages/auth/ForgotPasswordPage'),
  'ForgotPasswordPage',
)
const ResetPasswordPage = lazyNamed(
  () => import('@/pages/auth/ResetPasswordPage'),
  'ResetPasswordPage',
)
const UnauthorizedPage = lazyNamed(
  () => import('@/pages/auth/UnauthorizedPage'),
  'UnauthorizedPage',
)
const SetupPendingPage = lazyNamed(
  () => import('@/pages/auth/SetupPendingPage'),
  'SetupPendingPage',
)
const NotFoundPage = lazyNamed(() => import('@/pages/auth/NotFoundPage'), 'NotFoundPage')
const AdminDashboard = lazyNamed(
  () => import('@/pages/admin/AdminDashboard'),
  'AdminDashboard',
)
const AdminClearancesPage = lazyNamed(
  () => import('@/pages/admin/AdminClearancesPage'),
  'AdminClearancesPage',
)
const AuditLogsPage = lazyNamed(() => import('@/pages/admin/AuditLogsPage'), 'AuditLogsPage')
const CoursesPage = lazyNamed(() => import('@/pages/admin/CoursesPage'), 'CoursesPage')
const OfficeManagementPage = lazyNamed(
  () => import('@/pages/admin/OfficeManagementPage'),
  'OfficeManagementPage',
)
const ReportDataPage = lazyNamed(
  () => import('@/pages/admin/ReportDataPage'),
  'ReportDataPage',
)
const ReportsAnalyticsPage = lazyNamed(
  () => import('@/pages/admin/ReportsAnalyticsPage'),
  'ReportsAnalyticsPage',
)
const RoleManagementPage = lazyNamed(
  () => import('@/pages/admin/RoleManagementPage'),
  'RoleManagementPage',
)
const UserManagementPage = lazyNamed(
  () => import('@/pages/admin/UserManagementPage'),
  'UserManagementPage',
)
const WorkflowSettingsPage = lazyNamed(
  () => import('@/pages/admin/WorkflowSettingsPage'),
  'WorkflowSettingsPage',
)
const OfficeDashboard = lazyNamed(
  () => import('@/pages/office/OfficeDashboard'),
  'OfficeDashboard',
)
const OfficeQueuePage = lazyNamed(
  () => import('@/pages/office/OfficeQueuePage'),
  'OfficeQueuePage',
)
const OfficeRequestDetailsPage = lazyNamed(
  () => import('@/pages/office/OfficeRequestDetailsPage'),
  'OfficeRequestDetailsPage',
)
const ReviewRequestsPage = lazyNamed(
  () => import('@/pages/office/ReviewRequestsPage'),
  'ReviewRequestsPage',
)
const AcademicVerificationPage = lazyNamed(
  () => import('@/pages/registrar/AcademicVerificationPage'),
  'AcademicVerificationPage',
)
const ClearanceDecisionPage = lazyNamed(
  () => import('@/pages/registrar/ClearanceDecisionPage'),
  'ClearanceDecisionPage',
)
const RegistrarDashboard = lazyNamed(
  () => import('@/pages/registrar/RegistrarDashboard'),
  'RegistrarDashboard',
)
const RegistrarReportsPage = lazyNamed(
  () => import('@/pages/registrar/RegistrarReportsPage'),
  'RegistrarReportsPage',
)
const StudentRecordsValidationPage = lazyNamed(
  () => import('@/pages/registrar/StudentRecordsValidationPage'),
  'StudentRecordsValidationPage',
)
const NotificationsPage = lazyNamed(
  () => import('@/pages/shared/NotificationsPage'),
  'NotificationsPage',
)
const ProfileSettingsPage = lazyNamed(
  () => import('@/pages/shared/ProfileSettingsPage'),
  'ProfileSettingsPage',
)
const ClearanceDetailsPage = lazyNamed(
  () => import('@/pages/student/ClearanceDetailsPage'),
  'ClearanceDetailsPage',
)
const MyClearanceStatusPage = lazyNamed(
  () => import('@/pages/student/MyClearanceStatusPage'),
  'MyClearanceStatusPage',
)
const StudentDashboard = lazyNamed(
  () => import('@/pages/student/StudentDashboard'),
  'StudentDashboard',
)
const SubmitClearanceRequestPage = lazyNamed(
  () => import('@/pages/student/SubmitClearanceRequestPage'),
  'SubmitClearanceRequestPage',
)

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClearanceProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route element={<LoginPage />} path="/login" />
                <Route element={<ForgotPasswordPage />} path="/forgot-password" />
                <Route element={<ResetPasswordPage />} path="/reset-password" />
              </Route>
              <Route element={<RegisterPage />} path="/register" />

              <Route element={<UnauthorizedPage />} path="/unauthorized" />
              <Route element={<SetupPendingPage />} path="/setup-pending" />
              <Route element={<RoleRedirect />} path="/" />

              <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
                <Route element={<DashboardLayout />}>
                  <Route element={<StudentDashboard />} path="/student/dashboard" />
                  <Route
                    element={<SubmitClearanceRequestPage />}
                    path="/student/submit-clearance"
                  />
                  <Route
                    element={<MyClearanceStatusPage />}
                    path="/student/clearance-status"
                  />
                  <Route
                    element={<ClearanceDetailsPage />}
                    path="/student/clearance/:requestId"
                  />
                  <Route
                    element={<NotificationsPage />}
                    path="/student/notifications"
                  />
                  <Route element={<ProfileSettingsPage />} path="/student/profile" />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={[ROLES.OFFICE]} />}>
                <Route element={<DashboardLayout />}>
                  <Route element={<OfficeDashboard />} path="/office/dashboard" />
                  <Route
                    element={<ReviewRequestsPage />}
                    path="/office/review-requests"
                  />
                  <Route
                    element={<OfficeRequestDetailsPage />}
                    path="/office/requests/:requestId"
                  />
                  <Route element={<OfficeQueuePage />} path="/office/queue" />
                  <Route
                    element={<RegistrarReportsPage />}
                    path="/office/reports"
                  />
                  <Route
                    element={<NotificationsPage />}
                    path="/office/notifications"
                  />
                  <Route element={<ProfileSettingsPage />} path="/office/profile" />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={[ROLES.REGISTRAR]} />}>
                <Route element={<DashboardLayout />}>
                  <Route
                    element={<RegistrarDashboard />}
                    path="/registrar/dashboard"
                  />
                  <Route
                    element={<AcademicVerificationPage />}
                    path="/registrar/academic-verification"
                  />
                  <Route
                    element={<StudentRecordsValidationPage />}
                    path="/registrar/student-records"
                  />
                  <Route
                    element={<ClearanceDecisionPage />}
                    path="/registrar/clearance-decision"
                  />
                  <Route
                    element={<RegistrarReportsPage />}
                    path="/registrar/reports"
                  />
                  <Route
                    element={<NotificationsPage />}
                    path="/registrar/notifications"
                  />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route element={<DashboardLayout />}>
                  <Route element={<AdminDashboard />} path="/admin/dashboard" />
                  <Route
                    element={<AdminClearancesPage />}
                    path="/admin/clearances"
                  />
                  <Route
                    element={<ClearanceDetailsPage />}
                    path="/admin/clearances/:requestId"
                  />
                  <Route element={<UserManagementPage />} path="/admin/users" />
                  <Route element={<RoleManagementPage />} path="/admin/roles" />
                  <Route element={<OfficeManagementPage />} path="/admin/offices" />
                  <Route element={<CoursesPage />} path="/admin/courses" />
                  <Route
                    element={<WorkflowSettingsPage />}
                    path="/admin/workflow"
                  />
                  <Route
                    element={<ReportsAnalyticsPage />}
                    path="/admin/reports"
                  />
                  <Route element={<ReportDataPage />} path="/admin/report-data" />
                  <Route element={<AuditLogsPage />} path="/admin/audit-logs" />
                  <Route
                    element={<NotificationsPage />}
                    path="/admin/notifications"
                  />
                </Route>
              </Route>

              <Route element={<Navigate replace to="/" />} path="/dashboard" />
              <Route element={<NotFoundPage />} path="*" />
            </Routes>
          </Suspense>
        </ClearanceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function RouteFallback() {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <LoadingState />
    </div>
  )
}
