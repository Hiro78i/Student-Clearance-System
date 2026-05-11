import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RotateCcw,
  Search,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { REQUEST_STATUS, ROLES, STEP_STATUS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'
import {
  ALL_COURSES,
  filterRequestsByStudents,
  filterStepsByRequests,
  filterStudentsByCourse,
  getCourseOptions,
} from '@/utils/dashboardFilters'

const ALL_STATUSES = 'all'

export function RegistrarReportsPage() {
  const { profile } = useAuth()
  const { getOffice, getProfile, profiles, requests, steps } = useClearance()
  const isOfficeUser = profile.role === ROLES.OFFICE
  const officeName = getOffice(profile.office_id)?.office_name || 'Your Office'

  const [courseFilter, setCourseFilter] = useState(ALL_COURSES)
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const students = profiles.filter((item) => item.role === ROLES.STUDENT)
  const courseOptions = getCourseOptions(students)
  const filteredStudents = filterStudentsByCourse(students, courseFilter)
  const courseScopedRequests = filterRequestsByStudents(requests, filteredStudents)
  const officeScopedSteps = isOfficeUser
    ? steps.filter((step) => step.office_id === profile.office_id)
    : steps
  const officeScopedRequestIds = new Set(officeScopedSteps.map((step) => step.request_id))
  const scopedRequests = isOfficeUser
    ? courseScopedRequests.filter((request) => officeScopedRequestIds.has(request.id))
    : courseScopedRequests
  const scopedSteps = filterStepsByRequests(officeScopedSteps, scopedRequests)

  const normalizedSearch = search.trim().toLowerCase()
  const rows = scopedRequests
    .map((request) => {
      const student = getProfile(request.student_id)
      const requestSteps = steps.filter((step) => step.request_id === request.id)
      const selectedOfficeStep = isOfficeUser
        ? requestSteps.find((step) => step.office_id === profile.office_id)
        : null

      return {
        ...request,
        officeStatus: selectedOfficeStep?.status || 'Not routed',
        student,
        submittedLabel: request.submitted_at ? formatDate(request.submitted_at) : 'Draft only',
      }
    })
    .filter((row) => {
      const matchesStatus =
        statusFilter === ALL_STATUSES ||
        (isOfficeUser ? row.officeStatus === statusFilter : row.status === statusFilter)
      const matchesSearch =
        !normalizedSearch ||
        [row.id, row.student?.full_name, row.student?.course, row.purpose]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesStatus && matchesSearch
    })
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const rangeStart = rows.length ? (currentPage - 1) * pageSize + 1 : 0
  const rangeEnd = rows.length ? Math.min(currentPage * pageSize, rows.length) : 0

  const summaryCards = isOfficeUser
    ? buildOfficeSummaryCards(scopedSteps)
    : buildInstitutionalSummaryCards(rows)

  const pageTitle = isOfficeUser ? 'Office Reports' : 'Clearance Reports'
  const pageDescription = isOfficeUser
    ? 'Review the requests, progress updates, and clearance decisions currently routed to your office.'
    : 'Monitor clearance activity across student requests, approval progress, and report outcomes.'
  const pageEyebrow = isOfficeUser ? 'Office reporting' : 'Reports'
  const tableTitle = isOfficeUser ? `${officeName} Request Activity` : 'Clearance Request Activity'
  const filterDescription = isOfficeUser
    ? 'Refine the report list by student course, office status, or request details.'
    : 'Filter institution-wide request reporting by course, overall status, or keyword.'

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={pageEyebrow}
        title={pageTitle}
        description={pageDescription}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard
            description={card.description}
            icon={card.icon}
            key={card.label}
            label={card.label}
            tone={card.tone}
            value={card.value}
          />
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-lg font-bold text-slate-950">Report Filters</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {filterDescription}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_220px_220px] xl:items-end">
              <FilterField label="Search requests">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 pl-9"
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Request ID, student, program, or purpose"
                    value={search}
                  />
                </div>
              </FilterField>

              <FilterField label="Course / Program">
                <Select
                  className="h-11"
                  onChange={(event) => {
                    setCourseFilter(event.target.value)
                    setPage(1)
                  }}
                  value={courseFilter}
                >
                  <option value={ALL_COURSES}>All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </Select>
              </FilterField>

              <FilterField label={isOfficeUser ? 'Office Status' : 'Overall Status'}>
                <Select
                  className="h-11"
                  onChange={(event) => {
                    setStatusFilter(event.target.value)
                    setPage(1)
                  }}
                  value={statusFilter}
                >
                  <option value={ALL_STATUSES}>All statuses</option>
                  {(isOfficeUser ? OFFICE_STATUS_OPTIONS : REQUEST_STATUS_OPTIONS).map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ),
                  )}
                </Select>
              </FilterField>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl">{tableTitle}</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {rows.length} matching request(s) ready for office review and reporting.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill label="Requests" value={rows.length} />
              <Pill
                label={isOfficeUser ? 'Office Decisions' : 'Active Reviews'}
                value={
                  isOfficeUser
                    ? scopedSteps.filter((step) =>
                        [
                          STEP_STATUS.APPROVED,
                          STEP_STATUS.RETURNED,
                          STEP_STATUS.REJECTED,
                        ].includes(step.status),
                      ).length
                    : rows.filter((row) =>
                        [
                          REQUEST_STATUS.SUBMITTED,
                          REQUEST_STATUS.IN_REVIEW,
                        ].includes(row.status),
                      ).length
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Request</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>{isOfficeUser ? 'Office Status' : 'Overall Status'}</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="w-[140px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length ? (
                paginatedRows.map((row, index) => (
                  <TableRow
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
                    key={row.id}
                  >
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-950">{row.id}</p>
                        <p className="text-xs text-slate-500">{row.clearance_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-950">
                          {row.student?.full_name || 'Student record unavailable'}
                        </p>
                        <p className="text-xs text-slate-500">{row.student?.student_no}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[280px]">
                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                          {row.student?.course || 'Program not assigned'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <StatusBadge status={isOfficeUser ? row.officeStatus : row.status} />
                        {!isOfficeUser && (
                          <p className="text-xs text-slate-500">
                            {row.status === REQUEST_STATUS.COMPLETED
                              ? 'Request fully completed'
                              : 'Institution-wide progress status'}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800">{row.submittedLabel}</p>
                        <p className="text-xs text-slate-500">
                          Updated {formatDate(row.updated_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      {isOfficeUser ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/office/requests/${row.id}`}>
                            View Request
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">
                          Read only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-white">
                  <TableCell className="py-12 text-center" colSpan={6}>
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-base font-semibold text-slate-900">
                        No report rows match the current filters.
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        Adjust the search terms or filter selections to widen the
                        report view for your office.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  )
}

function Pill({ label, value }) {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
      {value} {label}
    </div>
  )
}

function SummaryCard({ description, icon, label, tone, value }) {
  const toneClasses = {
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          </div>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              toneClasses[tone]
            }`}
          >
            {icon}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  )
}

function buildOfficeSummaryCards(steps) {
  const approved = steps.filter((step) =>
    [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
  ).length
  const pending = steps.filter((step) => step.status === STEP_STATUS.PENDING).length
  const inReview = steps.filter((step) => step.status === STEP_STATUS.IN_REVIEW).length
  const returned = steps.filter((step) =>
    [STEP_STATUS.RETURNED, STEP_STATUS.REJECTED].includes(step.status),
  ).length

  return [
    {
      label: 'Total Requests',
      value: steps.length,
      description: 'All request steps currently visible to your office.',
      icon: <BarChart3 className="h-5 w-5" />,
      tone: 'slate',
    },
    {
      label: 'Approved',
      value: approved,
      description: 'Requests already cleared or marked not applicable.',
      icon: <CheckCircle2 className="h-5 w-5" />,
      tone: 'emerald',
    },
    {
      label: 'Pending',
      value: pending,
      description: 'Requests waiting for an initial review decision.',
      icon: <Clock3 className="h-5 w-5" />,
      tone: 'amber',
    },
    {
      label: 'In Review',
      value: inReview,
      description: 'Requests actively being processed by your office.',
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: 'blue',
    },
    {
      label: 'Returned',
      value: returned,
      description: 'Requests sent back for correction or follow-up.',
      icon: <RotateCcw className="h-5 w-5" />,
      tone: 'rose',
    },
  ]
}

function buildInstitutionalSummaryCards(rows) {
  const approved = rows.filter((row) =>
    [REQUEST_STATUS.APPROVED, REQUEST_STATUS.COMPLETED].includes(row.status),
  ).length
  const pending = rows.filter((row) => row.status === REQUEST_STATUS.SUBMITTED).length
  const inReview = rows.filter((row) => row.status === REQUEST_STATUS.IN_REVIEW).length
  const returned = rows.filter((row) => row.status === REQUEST_STATUS.REJECTED).length

  return [
    {
      label: 'Total Requests',
      value: rows.length,
      description: 'Requests included in the current institutional report.',
      icon: <BarChart3 className="h-5 w-5" />,
      tone: 'slate',
    },
    {
      label: 'Approved',
      value: approved,
      description: 'Requests fully approved or completed institution-wide.',
      icon: <CheckCircle2 className="h-5 w-5" />,
      tone: 'emerald',
    },
    {
      label: 'Pending',
      value: pending,
      description: 'Requests submitted but still waiting for office action.',
      icon: <Clock3 className="h-5 w-5" />,
      tone: 'amber',
    },
    {
      label: 'In Review',
      value: inReview,
      description: 'Requests actively moving through office verification.',
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: 'blue',
    },
    {
      label: 'Returned',
      value: returned,
      description: 'Requests requiring correction before completion.',
      icon: <RotateCcw className="h-5 w-5" />,
      tone: 'rose',
    },
  ]
}

const REQUEST_STATUS_OPTIONS = [
  REQUEST_STATUS.DRAFT,
  REQUEST_STATUS.SUBMITTED,
  REQUEST_STATUS.IN_REVIEW,
  REQUEST_STATUS.APPROVED,
  REQUEST_STATUS.REJECTED,
  REQUEST_STATUS.COMPLETED,
]

const OFFICE_STATUS_OPTIONS = [
  STEP_STATUS.PENDING,
  STEP_STATUS.IN_REVIEW,
  STEP_STATUS.APPROVED,
  STEP_STATUS.RETURNED,
  STEP_STATUS.REJECTED,
  STEP_STATUS.NOT_APPLICABLE,
]
