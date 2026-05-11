import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  RotateCcw,
  Search,
  Slash,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
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
import { STEP_STATUS } from '@/constants/roles'
import { promptRemarks, toast } from '@/lib/alerts'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { ALL_COURSES, getCourseOptions } from '@/utils/dashboardFilters'

const ALL_STATUSES = 'all'
const ALL_REVIEW_DATES = 'all'
const PAGE_SIZE = 8

export function ReviewRequestsPage() {
  const { profile } = useAuth()
  const { courses, decideStep, getOffice, getProfile, getRequest, steps } = useClearance()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [courseFilter, setCourseFilter] = useState(ALL_COURSES)
  const [reviewDateFilter, setReviewDateFilter] = useState(ALL_REVIEW_DATES)
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const office = getOffice(profile.office_id)
  const assignedRows = steps
    .filter((step) => step.office_id === profile.office_id)
    .map((step) => {
      const request = getRequest(step.request_id)
      const student = request ? getProfile(request.student_id) : null

      return {
        ...step,
        request,
        student,
      }
    })
    .filter((row) => row.request && row.student)

  if (!office) {
    return (
      <EmptyState
        description="This staff account has no linked office yet, so there are no review requests to display."
        title="Office assignment required"
      />
    )
  }

  const courseOptions = getCourseOptions(
    assignedRows.map((row) => row.student),
    courses,
  )

  const normalizedSearch = search.trim().toLowerCase()
  const today = new Date().toISOString().slice(0, 10)
  const filteredRows = assignedRows
    .filter((row) => {
      const matchesStatus =
        statusFilter === ALL_STATUSES || row.status === statusFilter
      const matchesCourse =
        courseFilter === ALL_COURSES || row.student?.course === courseFilter
      const reviewedDateValue = row.reviewed_at ? row.reviewed_at.slice(0, 10) : ''
      const matchesReviewDate =
        reviewDateFilter === ALL_REVIEW_DATES ||
        (reviewDateFilter === 'reviewed' && Boolean(row.reviewed_at)) ||
        (reviewDateFilter === 'unreviewed' && !row.reviewed_at) ||
        (reviewDateFilter === 'today' && reviewedDateValue === today)
              const matchesSearch =
                !normalizedSearch ||
                [
                  row.student?.full_name,
                  row.student?.student_no,
                  row.student?.course,
                  row.student?.department_college,
                  row.request?.clearance_type,
                ]
                  .filter(Boolean)
                  .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesCourse && matchesReviewDate && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'student') {
        return a.student.full_name.localeCompare(b.student.full_name)
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      if (sortBy === 'oldest') {
        return new Date(a.request.submitted_at || a.request.request_date) -
          new Date(b.request.submitted_at || b.request.request_date)
      }
      return new Date(b.request.submitted_at || b.request.request_date) -
        new Date(a.request.submitted_at || a.request.request_date)
    })

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const rangeStart = filteredRows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const rangeEnd = filteredRows.length
    ? Math.min(currentPage * PAGE_SIZE, filteredRows.length)
    : 0

  async function handleDecision(step, decision) {
    const response = await promptRemarks({
      title: `${decision} request?`,
      inputLabel: 'Decision remarks',
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
      toast(`Request ${decision.toLowerCase()}`)
    }
  }

  function resetPageAnd(action) {
    action()
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Office Review Queue"
        title="Review Requests"
        description={`Manage clearance requests assigned to your office, record decisions with remarks, and keep the review queue moving with clear workflow actions.`}
      />

      <Card className="overflow-visible">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-lg font-bold text-slate-950">Review Filters</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Search by request or student, then narrow the queue by status,
                  program, review date, or sort order for your office.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <InlinePill label="Assigned Office" value={office?.office_name || 'Unassigned'} />
                <InlinePill label="Visible Requests" value={filteredRows.length} />
              </div>
            </div>
          </div>

          <div className="px-5 py-5 md:px-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] xl:items-start">
              <FilterField
                helper="Search by request ID or student name"
                label="Search"
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) =>
                      resetPageAnd(() => setSearch(event.target.value))
                    }
                    placeholder="Enter request ID, student name, student number, or program"
                    value={search}
                  />
                </div>
              </FilterField>

              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-2">
                <FilterField label="Status">
                  <Select
                    className="h-11"
                    onChange={(event) =>
                      resetPageAnd(() => setStatusFilter(event.target.value))
                    }
                    value={statusFilter}
                  >
                    <option value={ALL_STATUSES}>All statuses</option>
                    {REVIEWABLE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                    </Select>
                  </FilterField>

                <FilterField label="Course / Program">
                  <Select
                    className="h-11"
                    onChange={(event) =>
                      resetPageAnd(() => setCourseFilter(event.target.value))
                    }
                    value={courseFilter}
                  >
                    <option value={ALL_COURSES}>All programs</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                    </Select>
                  </FilterField>

                <FilterField label="Date Reviewed">
                  <Select
                    className="h-11"
                    onChange={(event) =>
                      resetPageAnd(() => setReviewDateFilter(event.target.value))
                    }
                    value={reviewDateFilter}
                  >
                    <option value={ALL_REVIEW_DATES}>All dates</option>
                    <option value="reviewed">With review date</option>
                    <option value="unreviewed">Not yet reviewed</option>
                    <option value="today">Reviewed today</option>
                    </Select>
                  </FilterField>

                <FilterField label="Sort By">
                  <Select
                    className="h-11"
                    onChange={(event) => resetPageAnd(() => setSortBy(event.target.value))}
                    value={sortBy}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="student">Student name</option>
                    <option value="status">Status</option>
                    </Select>
                  </FilterField>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">Assigned Review Requests</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Reviewable clearance requests routed to your office, with direct
                access to detailed records and decision controls.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {filteredRows.length} request(s) in view
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Clearance Type</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course / Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead className="w-[280px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length ? (
                paginatedRows.map((row, index) => {
                  const canReview = [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(
                    row.status,
                  )
                  const isNotApplicable = row.status === STEP_STATUS.NOT_APPLICABLE

                  return (
                    <TableRow
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'} cursor-default`}
                      key={row.id}
                    >
                      <TableCell className="py-6">
                        <Link
                          className="group block rounded-lg outline-none transition hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-200"
                          to={`/office/requests/${row.request.id}`}
                        >
                          <p className="font-bold text-slate-950 transition group-hover:text-blue-700">
                            {row.request.clearance_type}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Submitted {formatDate(row.request.submitted_at || row.request.request_date)}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className="py-6">
                        <Link
                          className="block rounded-lg outline-none transition hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-200"
                          to={`/office/requests/${row.request.id}`}
                        >
                          <p className="font-semibold text-slate-950">
                            {row.student.full_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.student.student_no}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className="py-6">
                        <p className="max-w-[280px] line-clamp-2 text-sm leading-6 text-slate-600">
                          {row.student.course || row.student.department_college || 'Program unavailable'}
                        </p>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-1.5">
                          <StatusBadge status={row.status} />
                          <p className="text-xs text-slate-500">
                            {getStatusSupportCopy(row.status)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="space-y-1">
                          <p className="font-medium text-slate-800">
                            {row.reviewed_at ? formatDate(row.reviewed_at) : 'Not yet reviewed'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Submitted {formatDate(row.request.submitted_at || row.request.request_date)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild size="sm" type="button" variant="outline">
                            <Link to={`/office/requests/${row.request.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          {canReview && (
                            <>
                              <Button
                                onClick={() => handleDecision(row, STEP_STATUS.IN_REVIEW)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <Clock3 className="h-4 w-4" />
                                Review
                              </Button>
                              <Button
                                onClick={() => handleDecision(row, STEP_STATUS.APPROVED)}
                                size="sm"
                                type="button"
                                variant="success"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleDecision(row, STEP_STATUS.REJECTED)}
                                size="sm"
                                type="button"
                                variant="destructive"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {!canReview && (
                            <span className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-500">
                              {isNotApplicable ? 'Marked as N/A' : 'Already reviewed'}
                            </span>
                          )}
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
                        No review requests match the current filters.
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        Adjust the filters or search terms to show more clearance
                        requests assigned to your office.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <p className="text-sm font-medium text-slate-500">
              Showing {rangeStart}-{rangeEnd} of {filteredRows.length} request(s)
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

function FilterField({ children, helper, label }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

function InlinePill({ label, value }) {
  return (
    <div className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-600">
      <span className="text-slate-500">{label}</span>
      <span className="mx-2 h-1 w-1 rounded-full bg-slate-300" />
      <span className="text-slate-800">{value}</span>
    </div>
  )
}

function getStatusSupportCopy(status) {
  if (status === STEP_STATUS.PENDING) return 'Awaiting action'
  if (status === STEP_STATUS.IN_REVIEW) return 'Under review'
  if (status === STEP_STATUS.APPROVED) return 'Decision recorded'
  if (status === STEP_STATUS.REJECTED) return 'Decision recorded'
  if (status === STEP_STATUS.RETURNED) return 'Needs correction'
  if (status === STEP_STATUS.NOT_APPLICABLE) return 'No action needed'
  return 'Review status available'
}

const REVIEWABLE_STATUSES = [
  STEP_STATUS.PENDING,
  STEP_STATUS.IN_REVIEW,
  STEP_STATUS.APPROVED,
  STEP_STATUS.REJECTED,
  STEP_STATUS.RETURNED,
  STEP_STATUS.NOT_APPLICABLE,
]
