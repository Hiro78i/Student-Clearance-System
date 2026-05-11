import { useMemo, useState } from 'react'
import { Download, Eye, Filter, RotateCcw, Search, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'

const ALL_FILTERS = 'all'

export function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState(ALL_FILTERS)
  const [actorFilter, setActorFilter] = useState(ALL_FILTERS)
  const [detailsLog, setDetailsLog] = useState(null)
  const [endDate, setEndDate] = useState('')
  const [moduleFilter, setModuleFilter] = useState(ALL_FILTERS)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const pageSize = 8
  const { auditLogs, getProfile } = useClearance()

  const rows = useMemo(
    () =>
      auditLogs.map((log) => ({
        ...log,
        actor: getProfile(log.user_id)?.full_name || 'System',
      })),
    [auditLogs, getProfile],
  )
  const filterOptions = useMemo(
    () => ({
      actions: uniqueValues(rows.map((log) => log.action)),
      actors: uniqueValues(rows.map((log) => log.actor)),
      modules: uniqueValues(rows.map((log) => log.module)),
    }),
    [rows],
  )
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null

    return rows.filter((log) => {
      const createdAt = new Date(log.created_at)
      const matchesSearch =
        !normalizedSearch ||
        [log.actor, log.action, log.module, log.details]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      const matchesDate =
        (!start || createdAt >= start) && (!end || createdAt <= end)
      const matchesActor = actorFilter === ALL_FILTERS || log.actor === actorFilter
      const matchesAction = actionFilter === ALL_FILTERS || log.action === actionFilter
      const matchesModule = moduleFilter === ALL_FILTERS || log.module === moduleFilter

      return (
        matchesSearch &&
        matchesDate &&
        matchesActor &&
        matchesAction &&
        matchesModule
      )
    })
  }, [actionFilter, actorFilter, endDate, moduleFilter, rows, searchTerm, startDate])
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRows.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredRows])
  const activeFilterCount = [
    searchTerm,
    startDate,
    endDate,
    actorFilter !== ALL_FILTERS,
    actionFilter !== ALL_FILTERS,
    moduleFilter !== ALL_FILTERS,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Audit Logs"
        description="Critical system actions are recorded for compliance, accountability, and traceability."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryTile label="Total Events" value={rows.length} />
        <SummaryTile label="Filtered Results" tone="info" value={filteredRows.length} />
        <SummaryTile label="Active Filters" tone="warning" value={activeFilterCount} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 border-b border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Filter className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-slate-950">Audit Filters</p>
                  <p className="text-sm leading-6 text-slate-600">
                    Narrow logs by date, actor, action, module, or message content.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-12">
              <Field className="xl:col-span-4" label="Search logs">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 pl-9"
                    onChange={(event) => {
                      setPage(1)
                      setSearchTerm(event.target.value)
                    }}
                    placeholder="Search actor, action, module, or details..."
                    value={searchTerm}
                  />
                </div>
              </Field>
              <Field label="Start date">
                <Input
                  className="h-11"
                  onChange={(event) => {
                    setPage(1)
                    setStartDate(event.target.value)
                  }}
                  type="date"
                  value={startDate}
                />
              </Field>
              <Field label="End date">
                <Input
                  className="h-11"
                  onChange={(event) => {
                    setPage(1)
                    setEndDate(event.target.value)
                  }}
                  type="date"
                  value={endDate}
                />
              </Field>
              <Field label="Actor">
                <Select
                  aria-label="Filter by actor"
                  className="h-11"
                  onChange={(event) => {
                    setPage(1)
                    setActorFilter(event.target.value)
                  }}
                  value={actorFilter}
                >
                  <option value={ALL_FILTERS}>All actors</option>
                  {filterOptions.actors.map((actor) => (
                    <option key={actor} value={actor}>
                      {actor}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Action">
                <Select
                  aria-label="Filter by action"
                  className="h-11"
                  onChange={(event) => {
                    setPage(1)
                    setActionFilter(event.target.value)
                  }}
                  value={actionFilter}
                >
                  <option value={ALL_FILTERS}>All actions</option>
                  {filterOptions.actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Module">
                <Select
                  aria-label="Filter by module"
                  className="h-11"
                  onChange={(event) => {
                    setPage(1)
                    setModuleFilter(event.target.value)
                  }}
                  value={moduleFilter}
                >
                  <option value={ALL_FILTERS}>All modules</option>
                  {filterOptions.modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-col gap-1 xl:col-span-3">
                <div className="h-[18px]" />
                <div className="flex h-11 items-end gap-2">
                  <Button
                    className="h-11 flex-1"
                    onClick={() => exportAuditLogs(filteredRows)}
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    className="h-11 flex-1"
                    disabled={!activeFilterCount}
                    onClick={resetFilters}
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                {filteredRows.length} of {rows.length} logs shown
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                Latest: {rows[0] ? formatDate(rows[0].created_at) : 'No events'}
              </span>
            </div>
          </div>

          <div className="max-h-[34rem] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow className="hover:bg-white">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-24 text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((log) => (
                  <TableRow
                    className="group hover:bg-blue-50/40"
                    key={log.id}
                  >
                    <TableCell className="min-w-44 font-medium text-slate-700">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="min-w-44">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-slate-950">
                          {log.actor}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-48">
                      <Badge variant={getActionVariant(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="min-w-44 text-sm font-semibold text-slate-700">
                      {log.module}
                    </TableCell>
                    <TableCell className="min-w-72 max-w-md">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {log.details}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => setDetailsLog(log)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
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
                audit logs
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
                  No audit logs match the selected filters.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Adjust the date range, actor, action, module, or search text.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setDetailsLog(null)
        }}
        open={Boolean(detailsLog)}
      >
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Full event context for compliance review and administrative tracing.
          </DialogDescription>
        </DialogHeader>
        <DialogContent>
          {detailsLog && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <Detail label="Timestamp" value={formatDate(detailsLog.created_at)} />
                <Detail label="Actor" value={detailsLog.actor} />
                <Detail label="Action" value={detailsLog.action} />
                <Detail label="Module" value={detailsLog.module} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">Details</p>
                <p className="mt-2 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700">
                  {detailsLog.details}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function resetFilters() {
    setActionFilter(ALL_FILTERS)
    setActorFilter(ALL_FILTERS)
    setEndDate('')
    setModuleFilter(ALL_FILTERS)
    setPage(1)
    setSearchTerm('')
    setStartDate('')
  }
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function Field({ children, className = '', label }) {
  return (
    <div className={`space-y-1.5 xl:col-span-2 ${className}`}>
      <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      {children}
    </div>
  )
}

function SummaryTile({ label, tone = 'default', value }) {
  const toneClass = {
    default: 'bg-blue-50 text-blue-700',
    info: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`h-3 w-3 rounded-full ${toneClass}`} />
      </CardContent>
    </Card>
  )
}

function exportAuditLogs(rows) {
  const headers = ['Timestamp', 'Actor', 'Action', 'Module', 'Details']
  const csvRows = rows.map((log) =>
    [
      formatDate(log.created_at),
      log.actor,
      log.action,
      log.module,
      log.details,
    ].map(escapeCsv),
  )
  const csv = [headers.map(escapeCsv), ...csvRows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `mabini-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function getActionVariant(action) {
  const normalizedAction = action.toLowerCase()

  if (normalizedAction.includes('delete') || normalizedAction.includes('reject')) {
    return 'destructive'
  }

  if (normalizedAction.includes('return') || normalizedAction.includes('reset')) {
    return 'warning'
  }

  if (
    normalizedAction.includes('approve') ||
    normalizedAction.includes('add') ||
    normalizedAction.includes('submit')
  ) {
    return 'success'
  }

  if (normalizedAction.includes('update')) {
    return 'default'
  }

  return 'secondary'
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}
