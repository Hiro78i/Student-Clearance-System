import { useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ROLES } from '@/constants/roles'
import { toast } from '@/lib/alerts'
import { useClearance } from '@/hooks/useClearance'

const ACCOUNT_SOURCE = {
  EXISTING: 'existing',
  NEW: 'new',
  NONE: 'none',
}

export function OfficeEditDialog({ office, mode = 'edit', open, onOpenChange, onSaved }) {
  const { addOffice, offices, profiles, updateOfficeDetails } = useClearance()
  const [isSaving, setIsSaving] = useState(false)
  const existingAccount = profiles.find(
    (profile) => profile.office_id === office?.id && profile.role !== ROLES.ADMIN,
  )
  const availableAccounts = useMemo(
    () =>
      profiles.filter(
        (profile) =>
          profile.role !== ROLES.ADMIN &&
          (!profile.office_id || profile.office_id === office?.id),
      ),
    [office?.id, profiles],
  )
  const isCreateMode = mode === 'create'
  const defaultAccountSource = isCreateMode
    ? ACCOUNT_SOURCE.NONE
    : existingAccount
      ? ACCOUNT_SOURCE.EXISTING
      : ACCOUNT_SOURCE.NONE
  const [accountSource, setAccountSource] = useState(defaultAccountSource)
  const [selectedAccountId, setSelectedAccountId] = useState(existingAccount?.id || '')
  const [accountSearchTerm, setAccountSearchTerm] = useState('')

  const filteredAvailableAccounts = useMemo(() => {
    const normalizedSearch = accountSearchTerm.trim().toLowerCase()
    if (!normalizedSearch) return availableAccounts

    return availableAccounts.filter((profile) =>
      [profile.full_name, profile.email, profile.role_label, profile.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch)),
    )
  }, [accountSearchTerm, availableAccounts])

  if (!office) return null

  function resetDialogState(nextOpen) {
    if (!nextOpen) {
      setAccountSource(defaultAccountSource)
      setSelectedAccountId(existingAccount?.id || '')
      setAccountSearchTerm('')
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSaving) return

    const formData = new FormData(event.currentTarget)
    const officeName = formData.get('officeName').trim()
    const description = formData.get('description').trim()
    const orderNo = Number(formData.get('orderNo'))
    const accountRole = formData.get('accountRole') || ROLES.OFFICE
    const nextSelectedAccountId =
      accountSource === ACCOUNT_SOURCE.EXISTING ? selectedAccountId : ''
    const accountName =
      accountSource === ACCOUNT_SOURCE.NEW ? formData.get('accountName')?.trim() : ''
    const accountEmail =
      accountSource === ACCOUNT_SOURCE.NEW ? formData.get('accountEmail')?.trim() : ''

    if (accountSource === ACCOUNT_SOURCE.EXISTING && !nextSelectedAccountId) {
      toast('Select an account to assign')
      return
    }

    if (accountSource === ACCOUNT_SOURCE.NEW && (!accountName || !accountEmail)) {
      toast('Enter the new account name and email')
      return
    }

    try {
      setIsSaving(true)

      if (isCreateMode) {
        const createdOffice = await addOffice({
          officeName,
          description,
          orderNo,
          assignedProfileId: nextSelectedAccountId || null,
          accountName,
          accountEmail,
          accountRole,
        })
        onSaved?.(createdOffice)
        toast('Office added')
      } else {
        await updateOfficeDetails({
          officeId: office.id,
          officeName,
          description,
          orderNo,
          accountId: existingAccount?.id,
          assignedProfileId: nextSelectedAccountId || null,
          accountName,
          accountEmail,
          accountRole,
        })
        onSaved?.({
          ...office,
          office_name: officeName,
          description,
          order_no: orderNo,
        })
        toast('Office details updated')
      }

      resetDialogState(false)
    } catch (error) {
      toast(error?.message || 'Unable to save office details.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={resetDialogState} open={open}>
      <DialogHeader>
        <DialogTitle>{isCreateMode ? 'Add Office' : 'Edit Office Details'}</DialogTitle>
        <DialogDescription>
          {isCreateMode
            ? 'Create a new workflow office now, then optionally assign or create the staff account that will handle its clearance queue.'
            : 'Update the office information and assigned account used in the clearance workflow.'}
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" key={`${mode}-${office.id}`} onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="office-order">Order</Label>
              <Input
                id="office-order"
                min="1"
                name="orderNo"
                defaultValue={office.order_no || offices.length + 1}
                required
                type="number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office-name">Office / Department</Label>
              <Input
                id="office-name"
                name="officeName"
                defaultValue={office.office_name || ''}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="office-description">Description</Label>
            <Textarea
              id="office-description"
              name="description"
              defaultValue={office.description || ''}
              required
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-slate-950">Assigned Account</p>
              <p className="text-sm text-slate-600">
                Assign an existing office account, create a new one, or leave the
                office unassigned for now.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor="account-source">Assignment Mode</Label>
                <Select
                  id="account-source"
                  onChange={(event) => {
                    setAccountSource(event.target.value)
                    if (event.target.value !== ACCOUNT_SOURCE.EXISTING) {
                      setSelectedAccountId('')
                    }
                  }}
                  value={accountSource}
                >
                  <option value={ACCOUNT_SOURCE.EXISTING}>Assign existing account</option>
                  <option value={ACCOUNT_SOURCE.NEW}>Create new account</option>
                  <option value={ACCOUNT_SOURCE.NONE}>Leave unassigned</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-role">Account Role</Label>
                <Select
                  defaultValue={existingAccount?.role || ROLES.OFFICE}
                  disabled={accountSource === ACCOUNT_SOURCE.NONE}
                  id="account-role"
                  name="accountRole"
                >
                  <option value={ROLES.OFFICE}>College Office Staff</option>
                  <option value={ROLES.REGISTRAR}>Registrar Office</option>
                </Select>
              </div>
            </div>

            {accountSource === ACCOUNT_SOURCE.EXISTING && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="account-search">Search Account</Label>
                <Input
                  id="account-search"
                  onChange={(event) => setAccountSearchTerm(event.target.value)}
                  placeholder="Search by name, email, or role..."
                  value={accountSearchTerm}
                />
                <Label htmlFor="existing-account">Select Account</Label>
                <Select
                  id="existing-account"
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                  value={selectedAccountId}
                >
                  <option value="">Select an available account</option>
                  {filteredAvailableAccounts.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name} ({profile.email}){profile.role ? ` - ${profile.role}` : ''}
                    </option>
                  ))}
                </Select>
                {!availableAccounts.length && (
                  <p className="text-sm text-amber-700">
                    No available non-admin accounts are ready to assign yet.
                    Registered users will appear here once their profiles are loaded.
                  </p>
                )}
                {availableAccounts.length > 0 && !filteredAvailableAccounts.length && (
                  <p className="text-sm text-amber-700">
                    No accounts match the current search.
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Selecting a registered user here will assign them to this office and
                  update their role to the selected account role.
                </p>
              </div>
            )}

            {accountSource === ACCOUNT_SOURCE.NEW && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account-name">Staff Name</Label>
                  <Input id="account-name" name="accountName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-email">Staff Email</Label>
                  <Input id="account-email" name="accountEmail" type="email" />
                </div>
              </div>
            )}

            {accountSource === ACCOUNT_SOURCE.NONE && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This office will be saved without an assigned account. You can assign
                staff later from the office directory.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button disabled={isSaving} onClick={() => resetDialogState(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSaving} type="submit">
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : isCreateMode ? 'Create Office' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
