import { CheckCircle2, XCircle } from 'lucide-react'
import { DataTable, SortButton } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { STEP_STATUS } from '@/constants/roles'
import { promptRemarks, toast } from '@/lib/alerts'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

export function AcademicVerificationPage() {
  const { profile } = useAuth()
  const { decideStep, getProfile, getRequest, steps } = useClearance()
  const rows = steps
    .filter((step) => step.office_id === 'office-registrar')
    .map((step) => {
      const request = getRequest(step.request_id)
      return { ...step, request, student: getProfile(request.student_id) }
    })

  async function verify(step, decision) {
    const response = await promptRemarks({
      title: `${decision} academic verification?`,
      inputLabel: 'Registrar remarks',
      confirmButtonText: decision,
      icon: decision === STEP_STATUS.APPROVED ? 'success' : 'error',
    })

    if (response.isConfirmed) {
      const result = await decideStep({
        stepId: step.id,
        reviewerId: profile.id,
        decision,
        reviewRemarks: response.value,
      })
      if (result?.error) {
        toast(result.error, 'error')
        return
      }
      toast('Academic verification recorded')
    }
  }

  const columns = [
    {
      accessorKey: 'student.full_name',
      header: ({ column }) => <SortButton column={column}>Student</SortButton>,
    },
    { accessorKey: 'student.student_no', header: 'Student No.' },
    { accessorKey: 'student.course', header: 'Course' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Decision',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => verify(row.original, STEP_STATUS.APPROVED)}
            size="sm"
            type="button"
            variant="success"
          >
            <CheckCircle2 className="h-4 w-4" />
            Verify
          </Button>
          <Button
            onClick={() => verify(row.original, STEP_STATUS.REJECTED)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <XCircle className="h-4 w-4" />
            Return
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registrar review"
        title="Academic Verification"
        description="Validate academic standing before final clearance completion."
      />
      <DataTable columns={columns} data={rows} searchPlaceholder="Search student records..." />
    </div>
  )
}
