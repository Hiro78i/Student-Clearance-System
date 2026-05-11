import { CheckCircle2, RotateCcw, Slash, XCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { ClearanceTracker } from '@/components/shared/ClearanceTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STEP_STATUS } from '@/constants/roles'
import { promptRemarks, toast } from '@/lib/alerts'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

export function OfficeRequestDetailsPage() {
  const { requestId } = useParams()
  const { profile } = useAuth()
  const {
    decideStep,
    getOffice,
    getProfile,
    getRequest,
    getRequestSteps,
    offices,
  } = useClearance()
  const request = getRequest(requestId)

  if (!request) {
    return (
      <EmptyState
        description="The selected office request does not exist."
        title="Request not found"
      />
    )
  }

  const steps = getRequestSteps(request.id)
  const student = getProfile(request.student_id)
  const assignedStep = steps.find((step) => step.office_id === profile.office_id)
  const isStepApproved = assignedStep?.status === STEP_STATUS.APPROVED

  if (!profile.office_id) {
    return (
      <EmptyState
        description="Your account is active but is not yet attached to an office, so this request cannot be reviewed here."
        title="Office assignment required"
      />
    )
  }

  async function handleDecision(decision) {
    const response = await promptRemarks({
      title: `${decision} this clearance step?`,
      inputLabel: 'Decision remarks',
      confirmButtonText: decision,
      icon: decision === STEP_STATUS.APPROVED ? 'success' : 'error',
    })

    if (response.isConfirmed) {
      const result = await decideStep({
        stepId: assignedStep.id,
        reviewerId: profile.id,
        decision,
        reviewRemarks: response.value,
      })
      if (result?.error) {
        toast(result.error, 'error')
        return
      }
      toast(`Clearance step ${decision.toLowerCase()}`)
    }
  }

  async function handleEditApproval() {
    const response = await promptRemarks({
      title: 'Edit approved decision?',
      inputLabel: 'Reason for reopening this step',
      confirmButtonText: 'Reopen Review',
      icon: 'warning',
    })

    if (response.isConfirmed) {
      const result = await decideStep({
        stepId: assignedStep.id,
        reviewerId: profile.id,
        decision: STEP_STATUS.IN_REVIEW,
        reviewRemarks: response.value || 'Approval decision reopened for correction.',
      })
      if (result?.error) {
        toast(result.error, 'error')
        return
      }
      toast('Approval set back to in review')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Request details"
        title={student?.full_name || 'Student request'}
        description="Review student information, current route progress, and submit an official office decision."
        actions={
          assignedStep && (
            <>
              {isStepApproved ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approved
                  </span>
                  <Button onClick={handleEditApproval} type="button" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                    Edit approval
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => handleDecision(STEP_STATUS.APPROVED)}
                    type="button"
                    variant="success"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDecision(STEP_STATUS.REJECTED)}
                    type="button"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleDecision(STEP_STATUS.RETURNED)}
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Return
                  </Button>
                  <Button
                    onClick={() => handleDecision(STEP_STATUS.NOT_APPLICABLE)}
                    type="button"
                    variant="outline"
                  >
                    <Slash className="h-4 w-4" />
                    N/A
                  </Button>
                </>
              )}
            </>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Student record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Name" value={student?.full_name || 'N/A'} />
            <Info label="Student No." value={student?.student_no || 'N/A'} />
            <Info
              label="Course"
              value={student?.course || student?.department_college || 'N/A'}
            />
            <Info label="Request Date" value={request.request_date || 'N/A'} />
            <Info label="Semester" value={request.semester || 'N/A'} />
            <Info label="School Year" value={request.school_year || 'N/A'} />
            <Info label="Contact" value={request.contact_number || 'N/A'} />
            <Info label="Submitted" value={formatDate(request.submitted_at)} />
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Request status</span>
              <StatusBadge status={request.status} />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Purpose</p>
              <p className="mt-1 leading-6 text-slate-600">{request.purpose}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Requested Documents</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(request.requested_documents || []).map((document) => (
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    key={document}
                  >
                    {document === 'Others' && request.other_document
                      ? `Others: ${request.other_document}`
                      : document}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <ClearanceTracker getOffice={getOffice} getProfile={getProfile} offices={offices} steps={steps} />
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-950">{value}</span>
    </div>
  )
}
