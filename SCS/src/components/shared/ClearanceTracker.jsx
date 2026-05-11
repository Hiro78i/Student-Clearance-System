import {
  CheckCircle2,
  Circle,
  Clock3,
  MessageSquareText,
  RotateCcw,
  Slash,
  XCircle,
} from 'lucide-react'
import { STEP_STATUS } from '@/constants/roles'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { calculateRequiredProgress, formatDate } from '@/lib/utils'

function StepIcon({ status }) {
  if (status === STEP_STATUS.APPROVED) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  }

  if (status === STEP_STATUS.REJECTED) {
    return <XCircle className="h-5 w-5 text-rose-600" />
  }

  if (status === STEP_STATUS.RETURNED) {
    return <RotateCcw className="h-5 w-5 text-amber-600" />
  }

  if (status === STEP_STATUS.IN_REVIEW) {
    return <Clock3 className="h-5 w-5 text-blue-600" />
  }

  if (status === STEP_STATUS.NOT_APPLICABLE) {
    return <Slash className="h-5 w-5 text-slate-500" />
  }

  return <Circle className="h-5 w-5 text-slate-400" />
}

export function ClearanceTracker({ steps, getOffice, getProfile, offices = [] }) {
  // Enrich each step with is_required from the office list.
  const enrichedSteps = steps.map((step) => {
    const office = getOffice(step.office_id)
    const officeRecord = offices.find((o) => o.id === step.office_id)
    const isRequired = officeRecord ? officeRecord.is_required !== false : true
    return { ...step, is_required: isRequired, _office: office }
  })

  const requiredSteps = enrichedSteps.filter((step) => step.is_required)
  const progress = calculateRequiredProgress(enrichedSteps)
  const clearedRequired = requiredSteps.filter((step) =>
    [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
  ).length

  return (
    <Card>
      <CardContent className="space-y-6 p-5">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Clearance progress
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {clearedRequired} of {requiredSteps.length} required office checks completed
              </p>
            </div>
            <p className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
              {progress}%
            </p>
          </div>
          <div className="mt-3 h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-700 to-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Based on required offices only</p>
        </div>

        <div className="grid gap-3">
          {enrichedSteps.map((step) => {
            const office = step._office
            const reviewer = step.reviewed_by ? getProfile(step.reviewed_by) : null
            const approvalLog = step.digital_approval_log || []
            const latestUpdate = approvalLog.at(-1)

            return (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                key={step.id}
              >
                <div className="flex gap-4">
                  <div className="mt-1">
                    <StepIcon status={step.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            {office?.office_name}
                          </p>
                          {!step.is_required && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {getStudentFriendlyStatus(step.status)}
                        </p>
                      </div>
                      <StatusBadge status={step.status} />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {step.remarks}
                    </p>
                    <div className="mt-3 grid gap-2 text-xs font-medium text-slate-500 sm:grid-cols-2">
                      <span>Handled by: {reviewer?.full_name || 'Waiting for office review'}</span>
                      <span>Last update: {formatDate(step.reviewed_at)}</span>
                    </div>
                    {latestUpdate && (
                      <div className="mt-3 flex gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <span>
                          Latest update: {latestUpdate.status} by{' '}
                          {getProfile(latestUpdate.reviewed_by)?.full_name || 'Reviewer'} on{' '}
                          {formatDate(latestUpdate.reviewed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function getStudentFriendlyStatus(status) {
  if (status === STEP_STATUS.APPROVED) return 'This office has cleared your request.'
  if (status === STEP_STATUS.NOT_APPLICABLE) return 'This office does not need to review your request.'
  if (status === STEP_STATUS.IN_REVIEW) return 'This office is reviewing your request.'
  if (status === STEP_STATUS.RETURNED) return 'This office needs a correction or follow-up.'
  if (status === STEP_STATUS.REJECTED) return 'This office did not clear the request.'
  return 'Waiting for this office to review.'
}
