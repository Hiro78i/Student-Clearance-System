import { useMemo, useState } from 'react'
import {
  Building2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  UserRoundCheck,
} from 'lucide-react'
import { OfficeEditDialog } from '@/components/admin/OfficeEditDialog'
import { PageHeader } from '@/components/shared/PageHeader'
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
import { Textarea } from '@/components/ui/textarea'
import { ROLES } from '@/constants/roles'
import { confirmAction, toast } from '@/lib/alerts'
import { useClearance } from '@/hooks/useClearance'

export function WorkflowSettingsPage() {
  const {
    addOffice,
    deleteOffice,
    offices,
    profiles,
    resetWorkflowDefaults,
    updateWorkflowSettings,
  } = useClearance()
  const [draftOffices, setDraftOffices] = useState(() => normalizeOffices(offices))
  const [draggingId, setDraggingId] = useState(null)
  const [editingOffice, setEditingOffice] = useState(null)
  const [isAddingOffice, setIsAddingOffice] = useState(false)

  const accountByOffice = useMemo(() => {
    return profiles.reduce((accounts, profile) => {
      if (
        [ROLES.OFFICE, ROLES.REGISTRAR].includes(profile.role) &&
        profile.office_id
      ) {
        accounts[profile.office_id] = profile
      }

      return accounts
    }, {})
  }, [profiles])
  const requiredCount = draftOffices.filter((office) => office.is_required).length
  const optionalCount = draftOffices.length - requiredCount
  const assignedCount = draftOffices.filter((office) => accountByOffice[office.id]).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workflow"
        title="Clearance Workflow Settings"
        description="Configure the office route, requirements, and assigned accounts used by Mabini Colleges clearance processing."
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-bold text-slate-950">
                Workflow Configuration
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Drag offices to reorder the route, set required checkpoints, and
                review account coverage before saving.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveWorkflow} type="button">
                <Save className="h-4 w-4" />
                Save Workflow
              </Button>
              <Button onClick={() => setIsAddingOffice(true)} type="button" variant="outline">
                <Plus className="h-4 w-4" />
                Add Office
              </Button>
              <Button onClick={handleResetWorkflow} type="button" variant="secondary">
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <WorkflowMetric label="Route steps" value={draftOffices.length} />
            <WorkflowMetric label="Required" tone="success" value={requiredCount} />
            <WorkflowMetric label="Account coverage" tone="info" value={`${assignedCount}/${draftOffices.length}`} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-slate-950">Office Route Builder</p>
                <p className="text-sm text-slate-600">
                  Drag each workflow row to reorder the office route.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                {requiredCount} required
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                {optionalCount} optional
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {draftOffices.map((office, index) => {
              const account = accountByOffice[office.id]
              const isDragging = draggingId === office.id

              return (
                <div
                  className={`group rounded-xl border bg-white p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md ${
                    isDragging
                      ? 'scale-[0.99] border-blue-400 bg-blue-50 opacity-70 shadow-lg'
                      : 'border-slate-200'
                  }`}
                  draggable
                  key={office.id}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDraggingId(office.id)}
                  onDrop={() => handleDropOffice(office.id)}
                >
                  <div className="grid gap-3 lg:grid-cols-[auto_auto_minmax(0,1fr)_13rem_15rem_auto] lg:items-center">
                    <div className="flex items-center">
                      <span className="flex h-10 min-w-10 items-center justify-center rounded-lg bg-blue-950 px-3 text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    </div>

                    <span className="hidden h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 lg:flex">
                      <Building2 className="h-4 w-4" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950">{office.office_name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            office.is_required
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {office.is_required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                        {office.description}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs uppercase text-slate-500">
                        Requirement
                      </Label>
                      <Select
                        className="mt-1"
                        onChange={(event) =>
                          updateRequirement(office.id, event.target.value === 'required')
                        }
                        value={office.is_required ? 'required' : 'optional'}
                      >
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                      </Select>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Assigned Account
                      </p>
                      {account ? (
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <UserRoundCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {account.full_name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-amber-700">
                          No account assigned
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      <Button
                        onClick={() => setEditingOffice(office)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleRemoveOffice(office)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-rose-700" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <OfficeEditDialog
        office={editingOffice}
        onOpenChange={(open) => {
          if (!open) setEditingOffice(null)
        }}
        onSaved={handleOfficeSaved}
        open={Boolean(editingOffice)}
      />
      <AddOfficeDialog
        nextOrder={draftOffices.length + 1}
        onAddOffice={handleAddOffice}
        onOpenChange={setIsAddingOffice}
        open={isAddingOffice}
      />
    </div>
  )

  function handleDropOffice(targetId) {
    if (!draggingId || draggingId === targetId) return

    setDraftOffices((current) => {
      const draggingOffice = current.find((office) => office.id === draggingId)
      const targetIndex = current.findIndex((office) => office.id === targetId)
      const nextOffices = current.filter((office) => office.id !== draggingId)

      nextOffices.splice(targetIndex, 0, draggingOffice)

      return nextOffices.map((office, index) => ({
        ...office,
        order_no: index + 1,
      }))
    })
    setDraggingId(null)
  }

  async function handleRemoveOffice(office) {
    const response = await confirmAction({
      title: 'Remove workflow office?',
      text: `${office.office_name} and its assigned account will be removed from the demo workflow.`,
      confirmButtonText: 'Remove Office',
      icon: 'warning',
    })

    if (response.isConfirmed) {
      deleteOffice(office.id)
      setDraftOffices((current) =>
        normalizeOffices(current.filter((item) => item.id !== office.id)),
      )
      toast('Office removed from workflow')
    }
  }

  async function handleResetWorkflow() {
    const response = await confirmAction({
      title: 'Reset workflow?',
      text: 'This restores the default Mabini Colleges office route and assigned demo accounts.',
      confirmButtonText: 'Reset Workflow',
      icon: 'warning',
    })

    if (response.isConfirmed) {
      const defaults = await resetWorkflowDefaults()
      setDraftOffices(normalizeOffices(defaults))
      toast('Workflow restored to default')
    }
  }

  async function handleAddOffice(officeDetails) {
    const nextOffice = await addOffice(officeDetails)

    if (nextOffice) {
      setDraftOffices((current) => normalizeOffices([...current, nextOffice]))
    }
  }

  function handleOfficeSaved(nextOffice) {
    setDraftOffices((current) =>
      normalizeOffices(
        current.map((office) =>
          office.id === nextOffice.id
            ? { ...office, ...nextOffice, is_required: office.is_required }
            : office,
        ),
      ),
    )
  }

  async function handleSaveWorkflow() {
    await updateWorkflowSettings(draftOffices)
    toast('Workflow settings saved')
  }

  function updateRequirement(officeId, isRequired) {
    setDraftOffices((current) =>
      current.map((office) =>
        office.id === officeId ? { ...office, is_required: isRequired } : office,
      ),
    )
  }
}

function normalizeOffices(offices) {
  return offices
    .slice()
    .filter(Boolean)
    .sort((a, b) => a.order_no - b.order_no)
    .map((office, index) => ({
      ...office,
      order_no: index + 1,
      is_required: office.is_required !== false,
    }))
}

function AddOfficeDialog({ nextOrder, onAddOffice, onOpenChange, open }) {
  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onAddOffice({
      officeName: formData.get('officeName').trim(),
      description: formData.get('description').trim(),
      orderNo: formData.get('orderNo'),
      isRequired: formData.get('requirement') === 'required',
      accountName: formData.get('accountName').trim(),
      accountEmail: formData.get('accountEmail').trim(),
    })
    toast('Office added to workflow')
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>Add Workflow Office</DialogTitle>
        <DialogDescription>
          Create a new clearance checkpoint and optional assigned office account.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="new-office-order">Order</Label>
              <Input
                defaultValue={nextOrder}
                id="new-office-order"
                min="1"
                name="orderNo"
                required
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-office-name">Office / Department</Label>
              <Input id="new-office-name" name="officeName" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-office-description">Description</Label>
            <Textarea id="new-office-description" name="description" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-office-requirement">Requirement</Label>
            <Select defaultValue="required" id="new-office-requirement" name="requirement">
              <option value="required">Required</option>
              <option value="optional">Optional</option>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Assigned Account</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-account-name">Staff Name</Label>
                <Input id="new-account-name" name="accountName" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-account-email">Staff Email</Label>
                <Input id="new-account-email" name="accountEmail" type="email" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Add Office
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function WorkflowMetric({ label, tone = 'default', value }) {
  const toneClass = {
    default: 'bg-blue-50 text-blue-700',
    success: 'bg-emerald-50 text-emerald-700',
    info: 'bg-slate-100 text-slate-700',
  }[tone]

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-3 py-1 text-xl font-bold ${toneClass}`}>
        {value}
      </p>
    </div>
  )
}
