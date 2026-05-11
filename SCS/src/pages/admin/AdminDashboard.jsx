import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  Filter,
  RotateCcw,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { REQUEST_STATUS, ROLES, STEP_STATUS, resolveProfileRole } from '@/constants/roles'
import { useClearance } from '@/hooks/useClearance'
import {
  ALL_COURSES,
  filterRequestsByStudents,
  filterStepsByRequests,
  filterStudentsByCourse,
  getCourseOptions,
} from '@/utils/dashboardFilters'

const statusColors = {
  [REQUEST_STATUS.DRAFT]: '#64748b',
  [REQUEST_STATUS.SUBMITTED]: '#2563eb',
  [REQUEST_STATUS.IN_REVIEW]: '#f59e0b',
  [REQUEST_STATUS.REJECTED]: '#e11d48',
  [REQUEST_STATUS.COMPLETED]: '#059669',
  [REQUEST_STATUS.APPROVED]: '#047857',
}
const ALL_FILTERS = 'all'
const initialFilters = {
  academicTerm: ALL_FILTERS,
  course: ALL_COURSES,
  endDate: '',
  schoolYear: ALL_FILTERS,
  startDate: '',
}

export function AdminDashboard() {
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const { offices, profiles, requests, steps } = useClearance()
  const students = profiles.filter((profile) => resolveProfileRole(profile) === ROLES.STUDENT)
  const courseOptions = getCourseOptions(students)
  const academicTerms = uniqueValues([
    ...students.map((student) => student.graduation_term),
    ...requests.map((request) => request.semester),
  ])
  const schoolYears = uniqueValues(requests.map((request) => request.school_year))
  const hasPendingFilterChanges =
    JSON.stringify(draftFilters) !== JSON.stringify(filters)
  const appliedFilterChips = getAppliedFilterChips(filters)
  const filteredStudents = filterStudentsByCourse(students, filters.course)
  const filteredRequests = filterRequests(
    filterRequestsByStudents(requests, filteredStudents),
    filters,
    students,
  )
  const filteredSteps = filterStepsByRequests(steps, filteredRequests)
  const statusData = Object.values(REQUEST_STATUS)
    .map((status) => ({
      color: statusColors[status],
      name: status,
      value: filteredRequests.filter((request) => request.status === status).length,
    }))
    .filter((item) => item.value > 0)
  const officePerformance = offices.map((office) => {
    const officeSteps = filteredSteps.filter((step) => step.office_id === office.id)
    const approved = officeSteps.filter((step) =>
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
    ).length
    const pending = officeSteps.filter((step) =>
      [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(step.status),
    ).length
    const returned = officeSteps.filter((step) =>
      [STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status),
    ).length
    const clearanceRate = officeSteps.length
      ? Math.round((approved / officeSteps.length) * 100)
      : 0

    return {
      approved,
      clearanceRate,
      office,
      pending,
      returned,
      total: officeSteps.length,
    }
  })
  const completedRequests = filteredRequests.filter((request) =>
    [REQUEST_STATUS.APPROVED, REQUEST_STATUS.COMPLETED].includes(request.status),
  ).length
  const pendingRequests = filteredRequests.filter((request) =>
    [
      REQUEST_STATUS.DRAFT,
      REQUEST_STATUS.SUBMITTED,
      REQUEST_STATUS.IN_REVIEW,
    ].includes(request.status),
  ).length
  const completionRate = filteredRequests.length
    ? Math.round((completedRequests / filteredRequests.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Admin Dashboard"
        description="Centralized visibility across students, offices, workflows, reports, and audit activity."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white text-blue-700 shadow-sm ring-4 ring-blue-50/70">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
                  <Filter className="h-4 w-4" />
                </span>
              </span>
              <div>
                <p className="font-bold text-slate-950">Dashboard Filters</p>
                <p className="text-sm leading-6 text-slate-600">
                  Scope executive metrics by program, term, school year, and request
                  date window.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPendingFilterChanges && (
                <span className="inline-flex min-h-10 items-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700">
                  Changes not applied
                </span>
              )}
              <Button onClick={() => setFilters(draftFilters)} type="button">
                Apply Filters
              </Button>
              <Button onClick={resetFilters} type="button" variant="outline">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(17rem,1.25fr)_minmax(13rem,1fr)_minmax(10rem,0.8fr)_minmax(12rem,0.9fr)_minmax(12rem,0.9fr)]">
            <Field label="Course / Program">
              <Select
                id="admin-course-filter"
                onChange={(event) => updateDraftFilter('course', event.target.value)}
                value={draftFilters.course}
              >
                <option value={ALL_COURSES}>All Courses</option>
                {courseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Academic Term">
              <Select
                onChange={(event) =>
                  updateDraftFilter('academicTerm', event.target.value)
                }
                value={draftFilters.academicTerm}
              >
                <option value={ALL_FILTERS}>All terms</option>
                {academicTerms.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="School Year">
              <Select
                onChange={(event) => updateDraftFilter('schoolYear', event.target.value)}
                value={draftFilters.schoolYear}
              >
                <option value={ALL_FILTERS}>All years</option>
                {schoolYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start Date">
              <Input
                onChange={(event) => updateDraftFilter('startDate', event.target.value)}
                type="date"
                value={draftFilters.startDate}
              />
            </Field>
            <Field label="End Date">
              <Input
                onChange={(event) => updateDraftFilter('endDate', event.target.value)}
                type="date"
                value={draftFilters.endDate}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-slate-600">
                Applied filter state
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Dashboard metrics update after clicking Apply Filters.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {appliedFilterChips.map((chip) => (
                <span
                  className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm"
                  key={chip.label}
                >
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={`${filteredStudents.length} student profile(s) in the active cohort.`}
          icon={UsersRound}
          title="Total Students"
          value={filteredStudents.length}
        />
        <StatCard
          description={`${completedRequests} completed, ${pendingRequests} still active.`}
          icon={FileCheck2}
          title="Total Requests"
          tone="green"
          value={filteredRequests.length}
        />
        <StatCard
          description={`${completionRate}% request completion rate for the current scope.`}
          icon={CheckCircle2}
          title="Completion Rate"
          tone="slate"
          value={`${completionRate}%`}
        />
        <StatCard
          description={`${filteredSteps.length} office review step(s) across ${offices.length} offices.`}
          icon={UserRoundCheck}
          title="Workflow Steps"
          tone="amber"
          value={filteredSteps.length}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Request status mix</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Distribution of filtered clearance requests by current lifecycle
              status.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    innerRadius={68}
                    outerRadius={106}
                    paddingAngle={3}
                  >
                    {statusData.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip content={<StatusTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {statusData.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  key={item.name}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="text-sm font-bold text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Office performance metrics</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Clearance rate, pending queue, and returned/rejected counts by office.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {officePerformance.map((item) => (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                key={item.office.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {item.office.office_name}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                      {item.total} routed step(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.clearanceRate}%
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-emerald-600"
                    style={{ width: `${item.clearanceRate}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <MetricPill label="Cleared" tone="success" value={item.approved} />
                  <MetricPill label="Pending" tone="warning" value={item.pending} />
                  <MetricPill label="Returned" tone="danger" value={item.returned} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  function resetFilters() {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
  }

  function updateDraftFilter(key, value) {
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }
}

function Field({ children, className = '', label }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-[11px] font-black uppercase tracking-wide text-slate-600">
        {label}
      </Label>
      {children}
    </div>
  )
}

function MetricPill({ label, tone, value }) {
  const toneClass = {
    danger: 'bg-rose-50 text-rose-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className={`rounded-xl px-2 py-2 ${toneClass}`}>
      <p>{value}</p>
      <p className="mt-0.5 font-semibold">{label}</p>
    </div>
  )
}

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="font-bold text-slate-950">{item.name}</p>
      <p className="mt-1 text-sm text-slate-600">{item.value} request(s)</p>
    </div>
  )
}

function filterRequests(requests, filters, students) {
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null
  const studentById = Object.fromEntries(students.map((student) => [student.id, student]))

  return requests.filter((request) => {
    const requestDate = new Date(request.submitted_at || request.request_date)
    const student = studentById[request.student_id]
    const matchesDate = (!start || requestDate >= start) && (!end || requestDate <= end)
    const matchesTerm =
      filters.academicTerm === ALL_FILTERS ||
      request.semester === filters.academicTerm ||
      student?.graduation_term === filters.academicTerm
    const matchesSchoolYear =
      filters.schoolYear === ALL_FILTERS || request.school_year === filters.schoolYear

    return matchesDate && matchesTerm && matchesSchoolYear
  })
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function getAppliedFilterChips(filters) {
  return [
    {
      label: 'Course',
      value: filters.course === ALL_COURSES ? 'All courses' : filters.course,
    },
    {
      label: 'Term',
      value: filters.academicTerm === ALL_FILTERS ? 'All terms' : filters.academicTerm,
    },
    {
      label: 'Year',
      value: filters.schoolYear === ALL_FILTERS ? 'All years' : filters.schoolYear,
    },
    {
      label: 'Dates',
      value:
        filters.startDate || filters.endDate
          ? `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`
          : 'All dates',
    },
  ]
}
