import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CheckCircle2,
  Clock3,
  Filter,
  RotateCcw,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { REQUEST_STATUS } from '@/constants/roles'
import {
  ALL_FILTERS,
  buildReportRows,
  filterReportRows,
  getKpis,
  getOfficeAnalytics,
  initialReportFilters,
  toDateInputValue,
} from '@/features/clearance/reporting'
import { useClearance } from '@/hooks/useClearance'

export function ReportsAnalyticsPage() {
  const [activePreset, setActivePreset] = useState('')
  const [draftFilters, setDraftFilters] = useState(initialReportFilters)
  const [filters, setFilters] = useState(initialReportFilters)
  const { getOffice, getProfile, offices, requests, requestTrend, steps } =
    useClearance()

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
  const kpis = getKpis(filteredRows)
  const officeAnalytics = useMemo(
    () => getOfficeAnalytics(filteredRows, steps, getOffice),
    [filteredRows, getOffice, steps],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports and analytics"
        title="Reports and Analytics"
        description="Analyze Mabini Colleges clearance requests, office outcomes, and status movement from one admin reporting workspace."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Requests matching the active report filters."
          icon={TrendingUp}
          title="Total Requests"
          value={kpis.total}
        />
        <StatCard
          description="Requests completed or approved for release."
          icon={CheckCircle2}
          title="Approved"
          tone="green"
          value={kpis.approved}
        />
        <StatCard
          description="Requests rejected or returned by an office."
          icon={XCircle}
          title="Rejected"
          tone="rose"
          value={kpis.rejected}
        />
        <StatCard
          description="Requests still waiting for office action."
          icon={Clock3}
          title="Pending"
          tone="amber"
          value={kpis.pending}
        />
        <StatCard
          description="Approved or completed share of filtered requests."
          icon={CheckCircle2}
          title="Completion Rate"
          tone="slate"
          value={`${kpis.completionRate}%`}
        />
      </div>

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
                  before applying the report.
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
                  onChange={(event) => updateDraftFilter('search', event.target.value)}
                  placeholder="Search request, student, or purpose..."
                  value={draftFilters.search}
                />
              </div>
            </Field>
            <Field label="Start date">
              <Input
                onChange={(event) => updateDraftFilter('startDate', event.target.value)}
                type="date"
                value={draftFilters.startDate}
              />
            </Field>
            <Field label="End date">
              <Input
                onChange={(event) => updateDraftFilter('endDate', event.target.value)}
                type="date"
                value={draftFilters.endDate}
              />
            </Field>
            <Field label="Office">
              <Select
                aria-label="Filter by office"
                onChange={(event) => updateDraftFilter('officeId', event.target.value)}
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
                onChange={(event) => updateDraftFilter('status', event.target.value)}
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Approved vs rejected requests</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Monthly request movement based on the reporting trend dataset. Use this
              chart to compare clearance throughput and decision outcomes.
            </p>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={requestTrend} margin={{ bottom: 8, left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<ReportTooltip />} cursor={{ fill: '#eff6ff' }} />
                <Legend wrapperStyle={{ paddingTop: 16 }} />
                <Bar
                  dataKey="submitted"
                  fill="#2563eb"
                  name="Submitted"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="approved"
                  fill="#059669"
                  name="Approved"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="rejected"
                  fill="#e11d48"
                  name="Rejected"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Office outcome summary</CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Filtered request steps grouped by office for operational review.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {officeAnalytics.slice(0, 6).map((item) => (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                key={item.office}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.office}</p>
                  <p className="text-sm font-bold text-blue-700">{item.total} steps</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {item.approved} approved, {item.pending} pending, {item.rejected}{' '}
                  rejected/returned
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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

function ReportTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="font-bold text-slate-950">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <p className="text-sm font-medium text-slate-700" key={item.dataKey}>
            <span style={{ color: item.color }}>{item.name}</span>: {item.value}
          </p>
        ))}
      </div>
    </div>
  )
}
