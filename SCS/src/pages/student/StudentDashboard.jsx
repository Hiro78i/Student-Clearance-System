import {
  Bell,
  ChevronRight,
  Clock3,
  FileCheck2,
  ListChecks,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ClearanceTracker } from '@/components/shared/ClearanceTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'
import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'

export function StudentDashboard() {
  const { profile } = useAuth()
  const {
    getOffice,
    getProfile,
    getRequestSteps,
    getStudentRequests,
    notifications,
    offices,
  } = useClearance()
  const requests = getStudentRequests(profile.id)
  const activeRequest = requests[0]
  const steps = activeRequest ? getRequestSteps(activeRequest.id) : []
  const pending = steps.filter((step) =>
    [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(step.status),
  ).length
  const cleared = steps.filter((step) =>
    [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
  ).length
  const unread = notifications.filter(
    (notification) => notification.user_id === profile.id && !notification.is_read,
  )
  const primaryAction = getPrimaryAction(activeRequest)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Workspace"
        title={`Welcome, ${profile.full_name}`}
        description="Track your Mabini Colleges clearance request in real time and complete office approvals without paper routing."
        actions={
          <Button asChild>
            <Link to={primaryAction.to}>
              <primaryAction.icon className="h-4 w-4" />
              {primaryAction.label}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Clearance requests linked to your student account."
          icon={FileCheck2}
          title="My Requests"
          value={requests.length}
        />
        <StatCard
          description={
            activeRequest
              ? `${cleared} cleared, ${pending} still waiting for office review.`
              : 'Submit a request to start office review.'
          }
          icon={Clock3}
          title="Offices Waiting"
          tone="amber"
          value={pending}
        />
        <StatCard
          description="Current request status."
          icon={ShieldCheck}
          title="Clearance Status"
          tone={activeRequest?.status === 'Rejected' ? 'rose' : 'green'}
          value={activeRequest?.status || 'No Request'}
        />
        <StatCard
          description="Unread updates about your clearance request."
          icon={Bell}
          title="Notifications"
          value={unread.length}
        />
      </div>

      {activeRequest ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <ClearanceTracker
            getOffice={getOffice}
            getProfile={getProfile}
            offices={offices}
            steps={steps}
          />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Recent notifications</CardTitle>
                <Button asChild size="sm" variant="outline">
                  <Link to="/student/notifications">
                    View all
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {unread.slice(0, 4).map((notification) => (
                <div
                  className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm transition hover:border-blue-200 hover:bg-white"
                  key={notification.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-950">
                          {notification.title}
                        </p>
                        <StatusBadge status="Unread" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {!unread.length && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  You are all caught up. New clearance updates will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link to="/student/submit-clearance">Submit clearance request</Link>
            </Button>
          }
          description="Create your first digital clearance request to start office review."
          title="No clearance request yet"
        />
      )}
    </div>
  )
}

function getPrimaryAction(activeRequest) {
  if (!activeRequest) {
    return {
      icon: Send,
      label: 'Submit Request',
      to: '/student/submit-clearance',
    }
  }

  if (activeRequest.status === REQUEST_STATUS.DRAFT) {
    return {
      icon: Send,
      label: 'Continue Request',
      to: '/student/submit-clearance',
    }
  }

  return {
    icon: ListChecks,
    label: 'View Status',
    to: `/student/clearance/${activeRequest.id}`,
  }
}
