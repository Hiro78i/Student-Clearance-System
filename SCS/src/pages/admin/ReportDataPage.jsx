import { useMemo, useState } from 'react'
import { Download, Filter, RotateCcw, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { REQUEST_STATUS } from '@/constants/roles'
import {
  ALL_FILTERS,
  buildReportRows,
  exportOfficeSummary,
  exportReportRows,
  filterReportRows,
  getOfficeAnalytics,
  initialReportFilters,
  toDateInputValue,
} from '@/features/clearance/reporting'
import { useClearance } from '@/hooks/useClearance'
import { formatDate, formatShortDate } from '@/lib/utils'

export function ReportDataPage() {
  const [activePreset, setActivePreset] = useState('')
  const [draftFilters, setDraftFilters] = useState(initialReportFilters)
  const [filters, setFilters] = useState(initialReportFilters)
  const [page, setPage] = useState(1)
  const pageSize = 8
  const { getOffice, getProfile, offices, requests, steps } = useClearance()

  const reportRows = useMemo(
    () =>
      buildReportRows({
        filters,
        getProfile,
        requests,
        steps,
      }),
    [filters, getProfile, requests, steps],
  )
  const filteredRows = useMemo(
    () => filterReportRows(reportRows, filters),
    [filters, reportRows],
  )
  const officeAnalytics = useMemo(
    () => getOfficeAnalytics(filteredRows, steps, getOffice),
    [filteredRows, getOffice, steps],
  )
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRows.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredRows])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Report Data"
        description="Review filtered clearance request records and export detailed report data from a dedicated admin data workspace."
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
                <p className="font-bold text-slate-950">Report Filters</p>
                <p className="text-sm leading-6 text-slate-600">
                  Set a reporting window, office scope, request status, or keyword
                  before reviewing the data table.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setFilters(draftFilters)} type="button">
                Apply Filters
              </Button>
              <Button onClick={resetFilters} type="button" variant="outline">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-12">
            <Field className="lg:col-span-4" label="Keyword search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    setPage(1)
                    updateDraftFilter('search', event.target.value)
                  }}
                  placeholder="Search request, student, or purpose..."
                  value={draftFilters.search}
                />
              </div>
            </Field>
            <Field label="Start date">
              <Input
                onChange={(event) => {
                  setPage(1)
                  updateDraftFilter('startDate', event.target.value)
                }}
                type="date"
                value={draftFilters.startDate}
              />
            </Field>
            <Field label="End date">
              <Input
                onChange={(event) => {
                  setPage(1)
                  updateDraftFilter('endDate', event.target.value)
                }}
                type="date"
                value={draftFilters.endDate}
              />
            </Field>
            <Field label="Office">
              <Select
                aria-label="Filter by office"
                onChange={(event) => {
                  setPage(1)
                  updateDraftFilter('officeId', event.target.value)
                }}
                value={draftFilters.officeId}
              >
                <option value={ALL_FILTERS}>All offices</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.office_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select
                aria-label="Filter by request status"
                onChange={(event) => {
                  setPage(1)
                  updateDraftFilter('status', event.target.value)
                }}
                value={draftFilters.status}
              >
                <option value={ALL_FILTERS}>All statuses</option>
                <option value={REQUEST_STATUS.DRAFT}>Draft</option>
                <option value={REQUEST_STATUS.SUBMITTED}>Submitted</option>
                <option value={REQUEST_STATUS.IN_REVIEW}>In Review</option>
                <option value={REQUEST_STATUS.APPROVED}>Approved</option>
                <option value={REQUEST_STATUS.REJECTED}>Rejected</option>
                <option value={REQUEST_STATUS.COMPLETED}>Completed</option>
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-bold uppercase text-slate-500">
              Quick dates
            </span>
            <PresetButton
              active={activePreset === 'today'}
              label="Today"
              onClick={() => applyPreset(0, 'today')}
            />
            <PresetButton
              active={activePreset === '7-days'}
              label="Last 7 days"
              onClick={() => applyPreset(7, '7-days')}
            />
            <PresetButton
              active={activePreset === '30-days'}
              label="Last 30 days"
              onClick={() => applyPreset(30, '30-days')}
            />
            <PresetButton
              active={activePreset === 'school-week'}
              label="This school week"
              onClick={() => {
                setActivePreset('school-week')
                setDraftFilters((current) => ({
                  ...current,
                  endDate: '2026-04-23',
                  startDate: '2026-04-20',
                }))
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-lg font-bold text-slate-950">Report Data</p>
              <p className="mt-1 text-sm text-slate-600">
                {filteredRows.length} filtered request(s) ready for review or export.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => exportReportRows(filteredRows)} type="button">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => exportOfficeSummary(officeAnalytics)}
                type="button"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Export Office Summary
              </Button>
            </div>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow className="hover:bg-white">
                  <TableHead>Request</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Office Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow className="hover:bg-blue-50/40" key={row.id}>
                    <TableCell className="min-w-44">
                      <p className="font-bold text-slate-950">{row.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.clearance_type}</p>
                    </TableCell>
                    <TableCell className="min-w-56">
                      <p className="font-semibold text-slate-900">
                        {row.student?.full_name || 'Unknown student'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.student?.course || 'No course recorded'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="min-w-40">
                      {row.submitted_at
                        ? formatDate(row.submitted_at)
                        : formatShortDate(row.request_date)}
                    </TableCell>
                    <TableCell className="min-w-52">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-600"
                          style={{
                            width: `${row.totalSteps ? Math.round((row.approvedSteps / row.totalSteps) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        {row.approvedSteps}/{row.totalSteps} cleared, {row.pendingSteps}{' '}
                        pending
                      </p>
                    </TableCell>
                    <TableCell className="min-w-44">
                      {filters.officeId === ALL_FILTERS ? (
                        <span className="text-sm text-slate-600">All offices</span>
                      ) : (
                        <StatusBadge status={row.selectedOfficeStatus} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRows.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-slate-600">
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filteredRows.length)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{filteredRows.length}</span>{' '}
                report rows
              </p>
              <div className="flex items-center gap-2">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {!filteredRows.length && (
            <div className="p-4 sm:p-5">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="font-semibold text-slate-950">
                  No report data matches the active filters.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Adjust the date range, office, status, or search terms and apply
                  the filters again.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  function applyPreset(daysBack, preset) {
    const end = new Date('2026-04-23T00:00:00')
    const start = new Date(end)

    start.setDate(end.getDate() - daysBack)
    setActivePreset(preset)
    setDraftFilters((current) => ({
      ...current,
      endDate: toDateInputValue(end),
      startDate: toDateInputValue(start),
    }))
  }

  function resetFilters() {
    setActivePreset('')
    setDraftFilters(initialReportFilters)
    setFilters(initialReportFilters)
    setPage(1)
  }

  function updateDraftFilter(key, value) {
    setActivePreset('')
    setDraftFilters((current) => ({ ...current, [key]: value }))
  }
}

function Field({ children, className = '', label }) {
  return (
    <div className={`space-y-1 lg:col-span-2 ${className}`}>
      <Label className="text-xs uppercase text-slate-500">{label}</Label>
      {children}
    </div>
  )
}

function PresetButton({ active = false, label, onClick }) {
  return (
    <button
      className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
        active
          ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
