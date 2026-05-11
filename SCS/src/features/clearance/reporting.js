import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'
import { formatDate } from '@/lib/utils'

export const ALL_FILTERS = 'all'

export const initialReportFilters = {
  endDate: '',
  officeId: ALL_FILTERS,
  search: '',
  startDate: '',
  status: ALL_FILTERS,
}

export function buildReportRows({ filters, getProfile, requests, steps }) {
  return requests.map((request) => {
    const student = getProfile(request.student_id)
    const requestSteps = steps.filter((step) => step.request_id === request.id)
    const approvedSteps = requestSteps.filter((step) =>
      [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status),
    )
    const pendingSteps = requestSteps.filter((step) =>
      [STEP_STATUS.PENDING, STEP_STATUS.IN_REVIEW].includes(step.status),
    )
    const rejectedSteps = requestSteps.filter((step) =>
      [STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status),
    )
    const selectedOfficeStep =
      filters.officeId === ALL_FILTERS
        ? null
        : requestSteps.find((step) => step.office_id === filters.officeId)

    return {
      ...request,
      approvedSteps: approvedSteps.length,
      pendingSteps: pendingSteps.length,
      rejectedSteps: rejectedSteps.length,
      selectedOfficeStatus: selectedOfficeStep?.status || 'Not routed',
      student,
      totalSteps: requestSteps.length,
    }
  })
}

export function filterReportRows(rows, filters) {
  const normalizedSearch = filters.search.trim().toLowerCase()
  const start = filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : null

  return rows.filter((row) => {
    const requestDate = new Date(row.submitted_at || row.request_date)
    const matchesDate = (!start || requestDate >= start) && (!end || requestDate <= end)
    const matchesStatus = filters.status === ALL_FILTERS || row.status === filters.status
    const matchesOffice =
      filters.officeId === ALL_FILTERS || row.selectedOfficeStatus !== 'Not routed'
    const matchesSearch =
      !normalizedSearch ||
      [row.id, row.student?.full_name, row.student?.course, row.purpose]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesDate && matchesStatus && matchesOffice && matchesSearch
  })
}

export function getKpis(rows) {
  const approved = rows.filter((row) =>
    [REQUEST_STATUS.APPROVED, REQUEST_STATUS.COMPLETED].includes(row.status),
  ).length
  const rejected = rows.filter((row) => row.status === REQUEST_STATUS.REJECTED).length
  const pending = rows.filter((row) =>
    [REQUEST_STATUS.DRAFT, REQUEST_STATUS.SUBMITTED, REQUEST_STATUS.IN_REVIEW].includes(
      row.status,
    ),
  ).length
  const completionRate = rows.length ? Math.round((approved / rows.length) * 100) : 0

  return {
    approved,
    completionRate,
    pending,
    rejected,
    total: rows.length,
  }
}

export function getOfficeAnalytics(rows, steps, getOffice) {
  const rowIds = new Set(rows.map((row) => row.id))

  return Object.values(
    steps
      .filter((step) => rowIds.has(step.request_id))
      .reduce((summary, step) => {
        const office = getOffice(step.office_id)
        const key = office?.office_name || 'Unknown Office'

        summary[key] ||= {
          approved: 0,
          office: key,
          pending: 0,
          rejected: 0,
          total: 0,
        }
        summary[key].total += 1

        if ([STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status)) {
          summary[key].approved += 1
        } else if ([STEP_STATUS.REJECTED, STEP_STATUS.RETURNED].includes(step.status)) {
          summary[key].rejected += 1
        } else {
          summary[key].pending += 1
        }

        return summary
      }, {}),
  ).sort((a, b) => b.total - a.total)
}

export function exportReportRows(rows) {
  const headers = [
    'Request',
    'Student',
    'Course',
    'Status',
    'Submitted',
    'Approved Steps',
    'Pending Steps',
    'Rejected Steps',
    'Total Steps',
  ]
  const csvRows = rows.map((row) => [
    row.id,
    row.student?.full_name || '',
    row.student?.course || '',
    row.status,
    row.submitted_at ? formatDate(row.submitted_at) : row.request_date,
    row.approvedSteps,
    row.pendingSteps,
    row.rejectedSteps,
    row.totalSteps,
  ])

  downloadCsv('mabini-clearance-report', [headers, ...csvRows])
}

export function exportOfficeSummary(rows) {
  const headers = ['Office', 'Total Steps', 'Approved', 'Pending', 'Rejected/Returned']
  const csvRows = rows.map((row) => [
    row.office,
    row.total,
    row.approved,
    row.pending,
    row.rejected,
  ])

  downloadCsv('mabini-office-summary', [headers, ...csvRows])
}

export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

function downloadCsv(name, rows) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
