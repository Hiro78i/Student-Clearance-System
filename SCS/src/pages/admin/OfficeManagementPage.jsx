import { useMemo, useState } from 'react'
import {
  Building2,
  Ellipsis,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import { OfficeEditDialog } from '@/components/admin/OfficeEditDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ROLES } from '@/constants/roles'
import { confirmAction, toast } from '@/lib/alerts'
import { useClearance } from '@/hooks/useClearance'

const ALL_STATUSES = 'all'
const ASSIGNED_STATUS = 'assigned'
const UNASSIGNED_STATUS = 'unassigned'
const ALL_OFFICES = 'all'

export function OfficeManagementPage() {
  const [editingOffice, setEditingOffice] = useState(null)
  const [dialogMode, setDialogMode] = useState('edit')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [officeFilter, setOfficeFilter] = useState(ALL_OFFICES)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const { deleteOffice, offices, profiles } = useClearance()

  const rows = offices.map((office) => {
    const account = profiles.find(
      (profile) =>
        profile.office_id === office.id &&
        profile.role !== ROLES.ADMIN,
    )

    return {
      ...office,
      account,
      account_status: account ? 'Approved' : 'Pending',
    }
  })
  const assignedCount = rows.filter((office) => office.account).length
  const unassignedCount = rows.length - assignedCount
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return rows.filter((office) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          office.office_name,
          office.description,
          office.account?.full_name,
          office.account?.email,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      const matchesStatus =
        statusFilter === ALL_STATUSES ||
        (statusFilter === ASSIGNED_STATUS && office.account) ||
        (statusFilter === UNASSIGNED_STATUS && !office.account)
      const matchesOffice = officeFilter === ALL_OFFICES || office.id === officeFilter

      return matchesSearch && matchesStatus && matchesOffice
    })
  }, [officeFilter, rows, searchTerm, statusFilter])

  async function handleDeleteOffice(office) {
    const response = await confirmAction({
      title: 'Delete office?',
      text: `${office.office_name} and its assigned account will be removed from the demo workflow.`,
      confirmButtonText: 'Delete Office',
      icon: 'warning',
    })

    if (response.isConfirmed) {
      deleteOffice(office.id)
      toast('Office deleted')
    }
  }

  function handleAddOffice() {
    const nextOrder = offices.length + 1
    setDialogMode('create')
    setEditingOffice({
      id: 'new-office',
      office_name: '',
      description: '',
      order_no: nextOrder,
    })
  }

  function handleAssignAccount() {
    const unassignedOffice = rows.find((office) => !office.account)

    if (!unassignedOffice) {
      toast('All offices already have assigned accounts')
      return
    }

    setDialogMode('edit')
    setStatusFilter(UNASSIGNED_STATUS)
    setOfficeFilter(unassignedOffice.id)
    setSearchTerm('')
    setEditingOffice(unassignedOffice)
  }

  function resetFilters() {
    setOfficeFilter(ALL_OFFICES)
    setSearchTerm('')
    setStatusFilter(ALL_STATUSES)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clearance offices"
        title="Office Management"
        description="Maintain the offices and authorized accounts that participate in the Mabini Colleges clearance approval workflow."
      />


      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile
              icon={<Building2 className="h-4 w-4" />}
              label="Workflow Offices"
              value={offices.length}
            />
            <MetricTile
              icon={<UserRoundCheck className="h-4 w-4" />}
              label="Assigned Accounts"
              tone="success"
              value={assignedCount}
            />
            <MetricTile
              icon={<Mail className="h-4 w-4" />}
              label="Coverage Gaps"
              tone="warning"
              value={unassignedCount}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-950">
                  Office Directory
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Review workflow order, staff ownership, and account coverage in a
                  denser administrative view.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAddOffice} type="button" variant="outline">
                  <Plus className="h-4 w-4" />
                  Add Office
                </Button>
                <Button onClick={handleAssignAccount} type="button">
                  <Plus className="h-4 w-4" />
                  Assign Account
                </Button>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_12rem_14rem_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search office, staff, or email..."
                  value={searchTerm}
                />
              </div>
              <Select
                aria-label="Filter by assignment status"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value={ALL_STATUSES}>All statuses</option>
                <option value={ASSIGNED_STATUS}>Assigned only</option>
                <option value={UNASSIGNED_STATUS}>Unassigned only</option>
              </Select>
              <Select
                aria-label="Filter by office"
                onChange={(event) => setOfficeFilter(event.target.value)}
                value={officeFilter}
              >
                <option value={ALL_OFFICES}>All offices</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.office_name}
                  </option>
                ))}
              </Select>
              <Button
                disabled={
                  !searchTerm &&
                  statusFilter === ALL_STATUSES &&
                  officeFilter === ALL_OFFICES
                }
                onClick={resetFilters}
                type="button"
                variant="outline"
              >
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                {assignedCount} assigned
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                {unassignedCount} unassigned
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                {filteredRows.length} shown
              </span>
            </div>
          </div>

          {filteredRows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Assigned Account</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-14 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((office) => (
                  <TableRow key={office.id}>
                    <TableCell>
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-50 px-2 text-sm font-bold text-blue-800">
                        {office.order_no}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-950 text-white">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-950">
                            {office.office_name}
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            Clearance checkpoint
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {office.account ? (
                        <div className="min-w-48">
                          <p className="font-semibold text-slate-900">
                            {office.account.full_name}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {office.account.email}
                          </p>
                        </div>
                      ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                          No account assigned
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={office.account_status} />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-sm text-sm leading-6 text-slate-600">
                        {office.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu open={openMenuId === office.id}>
                          <Button
                            aria-label={`More actions for ${office.office_name}`}
                            onClick={() =>
                              setOpenMenuId(openMenuId === office.id ? null : office.id)
                            }
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                          {openMenuId === office.id && (
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDialogMode('edit')
                                  setEditingOffice(office)
                                  setOpenMenuId(null)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDialogMode('edit')
                                  setEditingOffice(office)
                                  setOpenMenuId(null)
                                }}
                              >
                                <UserRoundCheck className="h-4 w-4" />
                                {office.account ? 'Reassign account' : 'Assign account'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                  setOpenMenuId(null)
                                  handleDeleteOffice(office)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete office
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          )}
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 sm:p-5">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                <p className="font-semibold text-slate-950">
                  No offices match the filters.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Adjust the search, status, or office filter to broaden the view.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OfficeEditDialog
        key={`${dialogMode}-${editingOffice?.id || 'closed'}`}
        mode={dialogMode}
        office={editingOffice}
        onOpenChange={(open) => {
          if (!open) {
            setEditingOffice(null)
            setDialogMode('edit')
          }
        }}
        open={Boolean(editingOffice)}
      />
    </div>
  )
}

function MetricTile({ icon, label, tone = 'default', value }) {
  const toneClass = {
    default: 'bg-blue-50 text-blue-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      </div>
    </div>
  )
}
