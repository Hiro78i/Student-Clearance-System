import { DataTable, SortButton } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ROLES } from '@/constants/roles'
import { useClearance } from '@/hooks/useClearance'

export function StudentRecordsValidationPage() {
  const { profiles } = useClearance()
  const students = profiles.filter((profile) => profile.role === ROLES.STUDENT)
  const columns = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortButton column={column}>Student</SortButton>,
    },
    { accessorKey: 'student_no', header: 'Student No.' },
    { accessorKey: 'course', header: 'Course' },
    { accessorKey: 'graduation_term', header: 'Graduation Term' },
    {
      id: 'status',
      header: 'Record Status',
      cell: () => <StatusBadge status="Approved" />,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic records"
        title="Student Records Validation"
        description="Validate student profile, program, year level, and graduation term before clearance release."
      />
      <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />
    </div>
  )
}
