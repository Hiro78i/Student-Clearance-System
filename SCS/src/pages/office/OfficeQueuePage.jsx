import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

export function OfficeQueuePage() {
  const { profile } = useAuth()
  const { getOffice, getProfile, getRequest, getOfficeSteps } = useClearance()
  const office = getOffice(profile.office_id)
  const rows = getOfficeSteps(profile.office_id).map((step) => {
    const request = getRequest(step.request_id)
    const student = getProfile(request.student_id)
    return { step, request, student }
  })

  if (!office) {
    return (
      <EmptyState
        description="This account is active, but it still needs an office assignment before a queue can be shown."
        title="No office queue available"
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Queue management"
        title={`${office.office_name} Queue`}
        description="A focused queue view for the office staff assigned to this clearance checkpoint."
      />

      {rows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map(({ request, step, student }) => (
            <Card key={step.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-950">{student.full_name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {student.student_no} • {request.id}
                    </p>
                  </div>
                  <StatusBadge status={step.status} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {step.remarks}
                </p>
                <Button asChild className="mt-5" size="sm" variant="outline">
                  <Link to={`/office/requests/${request.id}`}>Open request</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          description="There are no requests currently assigned to your office."
          title="Queue is clear"
        />
      )}
    </div>
  )
}
