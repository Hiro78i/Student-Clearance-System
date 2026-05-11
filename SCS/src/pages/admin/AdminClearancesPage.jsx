import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'
import { confirmAction, toast } from '@/lib/alerts'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

const ALL_STATUSES = 'all'
const PAGE_SIZE = 8

function deriveWorkflowStatus({ requestStatus, requestSteps, requiredSteps }) {
  if (requestStatus === REQUEST_STATUS.DRAFT) return REQUEST_STATUS.DRAFT

  const hasRejectedOrReturned = requestSteps.some((step) =>
    [STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status),
  )
  if (hasRejectedOrReturned) return REQUEST_STATUS.REJECTED

  const allRequiredCleared =
    requiredSteps.length > 0 &&
    requiredSteps.every((step) =>
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
    )
  if (allRequiredCleared) return REQUEST_STATUS.COMPLETED

  return REQUEST_STATUS.IN_REVIEW
}

export function AdminClearancesPage() {
  const { profile } = useAuth()
  const {
    adminCompleteClearance,
    adminDeleteClearance,
    getProfile,
    getRequestSteps,
    offices,
    requests,
  } = useClearance()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [page, setPage] = useState(1)

  const normalizedSearch = search.trim().toLowerCase()
  const rows = requests
    .map((request) => {
      const student = getProfile(request.student_id)
      const requestSteps = getRequestSteps(request.id)
      const approvedSteps = requestSteps.filter((step) =>
        [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
      ).length
      const requiredSteps = requestSteps.filter((step) => {
        const office = offices.find((item) => item.id === step.office_id)
        return office ? office.is_required !== false : true
      })
      const approvedRequiredSteps = requiredSteps.filter((step) =>
        [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
      ).length
      const allRequiredCleared =
        requiredSteps.length > 0 && approvedRequiredSteps === requiredSteps.length
      const effectiveStatus = deriveWorkflowStatus({
        requestStatus: request.status,
        requestSteps,
        requiredSteps,
      })

      return {
        ...request,
        approvedSteps,
        approvedRequiredSteps,
        allRequiredCleared,
        effectiveStatus,
        requiredStepsCount: requiredSteps.length,
        student,
        totalSteps: requestSteps.length,
      }
    })
    .filter((row) => {
      const matchesStatus =
        statusFilter === ALL_STATUSES || row.effectiveStatus === statusFilter
      const matchesSearch =
        !normalizedSearch ||
        [row.id, row.student?.full_name, row.student?.student_no, row.student?.course]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesSearch
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = rows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const rangeEnd = rows.length ? Math.min(currentPage * PAGE_SIZE, rows.length) : 0

  async function handleCompleteRequest(row) {
    const studentName = row.student?.full_name || 'This student'
    const response = await confirmAction({
      title: 'Complete clearance request?',
      text: `${studentName}'s clearance request will be approved through all remaining workflow steps and marked complete.`,
      confirmButtonText: 'Complete Clearance',
      icon: 'warning',
    })

    if (!response.isConfirmed) return

    const result = await adminCompleteClearance({
      requestId: row.id,
      reviewerId: profile.id,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Clearance completed successfully')
  }

  async function handleDeleteRequest(row) {
    const response = await confirmAction({
      title: 'Delete clearance request?',
      text: `${row.id} and all related workflow steps will be permanently removed from the current admin clearance list.`,
      confirmButtonText: 'Delete Request',
      icon: 'warning',
    })

    if (!response.isConfirmed) return

    const result = await adminDeleteClearance({
      requestId: row.id,
      reviewerId: profile.id,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    toast('Clearance request deleted')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Clearance oversight"
        title="Clearances"
        description="Directly monitor submitted clearance requests and complete the workflow when a System Administrator needs to approve a request through to final completion."
      />

      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
          <FilterField label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by request ID, student name, or student number"
                value={search}
              />
            </div>
          </FilterField>
          <FilterField label="Status">
            <Select
              className="h-11"
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              value={statusFilter}
            >
              <option value={ALL_STATUSES}>All statuses</option>
              {Object.values(REQUEST_STATUS).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FilterField>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Admin Clearance Controls</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Review request progress and use direct completion only when an
                administrator needs to finalize the entire workflow.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {rows.length} request(s) in view
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Student</TableHead>
                <TableHead>Course / Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[320px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length ? (
                paginatedRows.map((row, index) => {
                  const effectiveStatus = row.effectiveStatus
                  const canComplete = ![REQUEST_STATUS.COMPLETED, REQUEST_STATUS.APPROVED].includes(
                    effectiveStatus,
                  )

                  return (
                    <TableRow
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'}
                      key={row.id}
                    >
                      <TableCell className="py-6">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-950">
                            {row.student?.full_name || 'Student unavailable'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {row.student?.student_no || 'No student number'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <p className="font-medium text-slate-800">
                          {row.student?.course ||
                            row.student?.department_college ||
                            'Program unavailable'}
                        </p>
                      </TableCell>
                      <TableCell className="py-6">
                        <StatusBadge status={effectiveStatus} />
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <ShieldCheck className="h-4 w-4 text-blue-700" />
                            {row.approvedRequiredSteps}/{row.requiredStepsCount} required steps cleared
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-emerald-600"
                              style={{
                                width: `${
                                  row.requiredStepsCount
                                    ? Math.round(
                                        (row.approvedRequiredSteps / row.requiredStepsCount) * 100,
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <p className="font-medium text-slate-800">
                          {formatDate(row.updated_at)}
                        </p>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild size="sm" type="button" variant="outline">
                            <Link to={`/admin/clearances/${row.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          {canComplete ? (
                            <Button
                              onClick={() => handleCompleteRequest(row)}
                              size="sm"
                              type="button"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              Complete
                            </Button>
                          ) : (
                            <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Completed
                            </span>
                          )}
                          <Button
                            onClick={() => handleDeleteRequest(row)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4 text-rose-700" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="hover:bg-white">
                  <TableCell className="py-12 text-center" colSpan={6}>
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-base font-semibold text-slate-900">
                        No clearance requests match the current filters.
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        Try adjusting the status filter or search terms to widen the
                        admin clearance view.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <p className="text-sm font-medium text-slate-500">
              Showing {rangeStart}-{rangeEnd} of {rows.length} request(s)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FilterField({ children, label }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  )
}
