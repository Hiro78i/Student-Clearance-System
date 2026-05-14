import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { UserChangePasswordDialog } from '@/components/admin/UserChangePasswordDialog'
import { UserCreateDialog } from '@/components/admin/UserCreateDialog'
import { UserEditDialog } from '@/components/admin/UserEditDialog'
import { DataTable, SortButton } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, resolveProfileRole } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { confirmAction, toast } from '@/lib/alerts'

export function UserManagementPage() {
  const { profile: activeProfile } = useAuth()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [passwordUser, setPasswordUser] = useState(null)

  const { deleteManagedUser, getOffice, loadingDirectory, profiles } = useClearance()

  const rows = profiles.map((profile) => ({
    ...profile,
    office: profile.office_id ? getOffice(profile.office_id)?.office_name : 'N/A',
  }))

  const columns = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => <SortButton column={column}>Name</SortButton>,
    },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const resolvedRole = resolveProfileRole(row.original)
        return ROLE_LABELS[resolvedRole] ?? row.original.role_label ?? row.original.role ?? 'Unassigned'
      },
    },
    { accessorKey: 'office', header: 'Office' },
    {
      id: 'access',
      header: 'Access',
      cell: () => <StatusBadge status="Approved" />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const isCurrentUser = row.original.id === activeProfile?.id

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              title="Edit user"
              onClick={() => setEditUser(row.original)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Change password"
              onClick={() => setPasswordUser(row.original)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={isCurrentUser ? 'You cannot delete your current account' : 'Delete user'}
              disabled={isCurrentUser}
              onClick={() => handleDeleteUser(row.original)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

  async function handleDeleteUser(user) {
    if (user.id === activeProfile?.id) {
      toast('You cannot delete your current signed-in account.', 'error')
      return
    }

    const response = await confirmAction({
      title: 'Delete user account?',
      text: `${user.full_name || user.email} will be removed from User Management. This action cannot be undone.`,
      confirmButtonText: 'Delete Account',
      icon: 'warning',
    })

    if (!response.isConfirmed) return

    try {
      await deleteManagedUser(user.id, {
        optimistic: true,
        onBackgroundError: (error) => {
          toast(
            error?.message ||
              'User was removed from the screen, but Supabase deletion did not finish.',
            'error',
          )
        },
      })
      toast('User removed. Supabase deletion is continuing in the background.')
    } catch (error) {
      toast(error?.message || 'Unable to delete user account.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Users"
        title="User Management"
        description="Manage student, office, registrar, and administrator profiles."
        actions={
          <Button onClick={() => setIsCreateOpen(true)} type="button">
            <Plus className="h-4 w-4" />
            Create User
          </Button>
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {loadingDirectory
          ? 'Syncing Supabase profiles and offices...'
          : 'Accounts created here can sign in using the email and password assigned by the administrator.'}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search users..."
        emptyTitle="No user profiles found"
        emptyDescription="If profiles exist in Supabase but nothing appears here, verify that your logged-in account is assigned the admin role and that the 2026-04-28 admin user management SQL migration has been run."
      />

      <UserCreateDialog onOpenChange={setIsCreateOpen} open={isCreateOpen} />

      <UserEditDialog
        user={editUser}
        open={Boolean(editUser)}
        onOpenChange={(open) => { if (!open) setEditUser(null) }}
      />

      <UserChangePasswordDialog
        user={passwordUser}
        open={Boolean(passwordUser)}
        onOpenChange={(open) => { if (!open) setPasswordUser(null) }}
      />
    </div>
  )
}
