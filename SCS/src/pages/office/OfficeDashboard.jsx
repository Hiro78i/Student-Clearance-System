import { CheckCircle2, Clock3, FileText, XCircle } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STEP_STATUS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'

export function OfficeDashboard() {
  const { profile } = useAuth()
  const { getOffice, getOfficeSteps, getRequest, getProfile } =
    useClearance()
  const office = getOffice(profile.office_id)
  const officeSteps = getOfficeSteps(profile.office_id)
  const officeTrend = buildOfficeTrend(officeSteps, getRequest)
  const pending = officeSteps.filter((step) =>
    [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(step.status),
  )
  const approved = officeSteps.filter((step) => step.status === STEP_STATUS.APPROVED)
  const rejected = officeSteps.filter((step) =>
    [STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status),
  )

  if (!office) {
    return (
      <EmptyState
        description="Your staff account can sign in, but it is not yet linked to a clearance office. Ask a system administrator to assign your office before processing requests."
        title="No office assigned yet"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Office Workspace"
        title={`${office.office_name} Dashboard`}
        description="Review assigned clearance steps, update digital approval status, add remarks, and monitor office activity."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Requests waiting for your office."
          icon={Clock3}
          title="Pending"
          tone="amber"
          value={pending.length}
        />
        <StatCard
          description="Approved clearance steps."
          icon={CheckCircle2}
          title="Approved"
          tone="green"
          value={approved.length}
        />
        <StatCard
          description="Rejected or returned requests."
          icon={XCircle}
          title="Rejected"
          tone="rose"
          value={rejected.length}
        />
        <StatCard
          description="Total records routed to this office."
          icon={FileText}
          title="Total Routed"
          value={officeSteps.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Request trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={officeTrend}>
                <defs>
                  <linearGradient id="submitted" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area
                  dataKey="submitted"
                  fill="url(#submitted)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent office activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {officeSteps.slice(0, 5).map((step) => {
              const request = getRequest(step.request_id)
              if (!request) return null
              const student = getProfile(request.student_id)
              return (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={step.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{student?.full_name || 'Student account'}</p>
                      <p className="mt-1 text-sm text-slate-600">{request.id}</p>
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {formatDate(step.reviewed_at || request.updated_at)}
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildOfficeTrend(officeSteps, getRequest) {
  const monthLabels = []
  const now = new Date()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(
      date.toLocaleString('en-US', {
        month: 'short',
      }),
    )
  }

  const countByMonth = new Map(monthLabels.map((month) => [month, 0]))

  officeSteps.forEach((step) => {
    const request = getRequest(step.request_id)
    const rawDate = request?.submitted_at || request?.updated_at || step?.reviewed_at
    if (!rawDate) return
    const date = new Date(rawDate)
    if (Number.isNaN(date.getTime())) return
    const month = date.toLocaleString('en-US', { month: 'short' })
    if (!countByMonth.has(month)) return
    countByMonth.set(month, (countByMonth.get(month) || 0) + 1)
  })

  return monthLabels.map((month) => ({
    month,
    submitted: countByMonth.get(month) || 0,
  }))
}
