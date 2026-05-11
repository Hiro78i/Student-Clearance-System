import { Eye, FileText, ListChecks, PenLine, Send, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, SortButton } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { confirmAction, toast } from '@/lib/alerts'
import { calculateRequiredProgress, formatDate } from '@/lib/utils'

export function MyClearanceStatusPage() {
  const { profile } = useAuth()
  const { deleteClearanceRequest, getRequestSteps, getStudentRequests } =
    useClearance()
  const requests = getStudentRequests(profile.id)
  const rows = requests.map((request) => {
    const steps = getRequestSteps(request.id)
    const requiredSteps = steps.filter((step) => {
      // is_required is stored on the office via context; fall back to true
      return step.is_required !== false
    })
    const clearedRequired = requiredSteps.filter((step) =>
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
    ).length
    const pendingSteps = steps.filter((step) =>
      [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(step.status),
    ).length

    return {
      ...request,
      clearedSteps: clearedRequired,
      totalSteps: requiredSteps.length,
      pendingSteps,
      progress: calculateRequiredProgress(steps),
    }
  })
  const summary = getSummary(rows)

  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }) => <SortButton column={column}>Request</SortButton>,
      cell: ({ row }) => (
        <div className="min-w-48">
          <p className="font-bold text-slate-950">
            {profile?.full_name || 'Student'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {getRequestContext(row.original)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'clearance_type',
      header: 'Clearance Type',
      cell: ({ row }) => (
        <p className="max-w-xs text-sm leading-6 text-slate-600">
          {row.original.clearance_type}
        </p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="space-y-1">
          <StatusBadge status={row.original.status} />
          <p className="text-xs text-slate-500">
            {getStudentStatusCopy(row.original.status)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => (
        <div className="min-w-44">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">
              {row.original.progress}%
            </span>
            <span className="text-xs text-slate-500">
              {row.original.clearedSteps}/{row.original.totalSteps} cleared
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-600"
              style={{ width: `${row.original.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {row.original.pendingSteps} office(s) still reviewing
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'submitted_at',
      header: ({ column }) => <SortButton column={column}>Submitted</SortButton>,
      cell: ({ row }) => (
        <div className="min-w-40 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">
            {formatSubmitted(row.original)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Updated {formatFriendlyDate(row.original.updated_at, 'No updates yet')}
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }) =>
        row.original.status === REQUEST_STATUS.DRAFT ? (
          <div className="flex min-w-52 flex-wrap gap-2">
            <Button asChild size="sm" variant="default">
              <Link to={`/student/submit-clearance?requestId=${row.original.id}`}>
                <PenLine className="h-4 w-4" />
                Edit Draft
              </Link>
            </Button>
            <Button
              onClick={() => handleDeleteRequest(row.original)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : (
          <RequestActionButton request={row.original} />
        ),
    },
  ]

  async function handleDeleteRequest(request) {
    const response = await confirmAction({
      title: 'Delete draft request?',
      text: `${request.id} will be removed from your clearance status list.`,
      confirmButtonText: 'Delete draft',
      icon: 'warning',
    })

    if (!response.isConfirmed) return

    const result = await deleteClearanceRequest({
      requestId: request.id,
      studentId: profile.id,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Draft request deleted')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Real-time tracking"
        title="My Clearance Status"
        description="Track every clearance request, see office progress, and continue the next step when action is needed."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          description="Saved but not yet sent for office review."
          icon={<PenLine className="h-4 w-4" />}
          label="Draft"
          value={summary.draft}
        />
        <SummaryCard
          description="Sent to the clearance workflow."
          icon={<Send className="h-4 w-4" />}
          label="Submitted"
          tone="blue"
          value={summary.submitted}
        />
        <SummaryCard
          description="Currently being checked by offices."
          icon={<ListChecks className="h-4 w-4" />}
          label="In Review"
          tone="amber"
          value={summary.inReview}
        />
        <SummaryCard
          description="Cleared or completed requests."
          icon={<FileText className="h-4 w-4" />}
          label="Cleared"
          tone="green"
          value={summary.cleared}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        emptyDescription="Submit a clearance request when you are ready to start office review."
        emptyTitle="No clearance requests yet"
        searchPlaceholder="Search requests, status, or clearance type..."
      />
    </div>
  )
}

function RequestActionButton({ request }) {
  const action = getRequestAction(request)

  return (
    <Button asChild size="sm" variant={action.variant}>
      <Link to={action.to}>
        <action.icon className="h-4 w-4" />
        {action.label}
      </Link>
    </Button>
  )
}

function SummaryCard({ description, icon, label, tone = 'slate', value }) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          </div>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
            {icon}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  )
}

function formatFriendlyDate(value, fallback) {
  if (!value) return fallback
  return formatDate(value)
}

function formatSubmitted(request) {
  if (request.submitted_at) return formatDate(request.submitted_at)
  if (request.status === REQUEST_STATUS.DRAFT) return 'Draft only'
  return 'Not yet submitted'
}

function getRequestAction(request) {
  if (request.status === REQUEST_STATUS.DRAFT) {
    return {
      icon: PenLine,
      label: 'Resume Draft',
      to: '/student/submit-clearance',
      variant: 'default',
    }
  }

  if ([REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.IN_REVIEW].includes(request.status)) {
    return {
      icon: ListChecks,
      label: 'Track Progress',
      to: `/student/clearance/${request.id}`,
      variant: 'outline',
    }
  }

  if (request.status === REQUEST_STATUS.REJECTED) {
    return {
      icon: Eye,
      label: 'View Details',
      to: `/student/clearance/${request.id}`,
      variant: 'outline',
    }
  }

  return {
    icon: Eye,
    label: 'View Details',
    to: `/student/clearance/${request.id}`,
    variant: 'outline',
  }
}

function getRequestContext(request) {
  if (request.status === REQUEST_STATUS.DRAFT) return 'Saved draft'
  if (!request.submitted_at) return 'Not yet submitted'
  return `Requested on ${request.request_date}`
}

function getStudentStatusCopy(status) {
  if (status === REQUEST_STATUS.DRAFT) return 'You can continue this request.'
  if (status === REQUEST_STATUS.SUBMITTED) return 'Sent for office review.'
  if (status === REQUEST_STATUS.IN_REVIEW) return 'Offices are checking your clearance.'
  if (status === REQUEST_STATUS.REJECTED) return 'Needs attention or follow-up.'
  if (status === REQUEST_STATUS.APPROVED) return 'Approved for completion.'
  if (status === REQUEST_STATUS.COMPLETED) return 'Clearance completed.'
  return 'Status available.'
}

function getSummary(rows) {
  return {
    cleared: rows.filter((request) =>
      [REQUEST_STATUS.APPROVED, REQUEST_STATUS.COMPLETED].includes(request.status),
    ).length,
    draft: rows.filter((request) => request.status === REQUEST_STATUS.DRAFT).length,
    inReview: rows.filter((request) => request.status === REQUEST_STATUS.IN_REVIEW)
      .length,
    submitted: rows.filter((request) => request.status === REQUEST_STATUS.SUBMITTED)
      .length,
  }
}
