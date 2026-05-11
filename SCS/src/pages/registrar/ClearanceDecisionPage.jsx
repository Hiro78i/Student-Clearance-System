import { DataTable, SortButton } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'

export function ClearanceDecisionPage() {
  const { getProfile, requests } = useClearance()
  const rows = requests.map((request) => ({
    ...request,
    student: getProfile(request.student_id),
  }))
  const columns = [
    {
      accessorKey: 'id',
      header: ({ column }) => <SortButton column={column}>Request</SortButton>,
      cell: ({ row }) => <span className="font-semibold">{row.original.id}</span>,
    },
    { accessorKey: 'student.full_name', header: 'Student' },
    { accessorKey: 'student.course', header: 'Course' },
    {
      accessorKey: 'status',
      header: 'Final Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'updated_at',
      header: 'Last Updated',
      cell: ({ row }) => formatDate(row.original.updated_at),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Final decision"
        title="Clearance Decision"
        description="Monitor final completion status after all offices and registrar verification are finished."
      />
      <DataTable columns={columns} data={rows} searchPlaceholder="Search clearance decisions..." />
    </div>
  )
}
