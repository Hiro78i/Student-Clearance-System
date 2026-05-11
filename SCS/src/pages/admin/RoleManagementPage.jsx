import {
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
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
import { ROLE_LABELS, ROLES } from '@/constants/roles'
import { toast } from '@/lib/alerts'
import { useClearance } from '@/hooks/useClearance'

const ALL_ROLES = 'all'

function resolveProfileRoleName(profile) {
  if (!profile) return ''
  if (profile.role && Object.values(ROLES).includes(profile.role)) return profile.role

  const normalizedLabel = (profile.role_label || '').trim().toLowerCase()
  const matchedEntry = Object.entries(ROLE_LABELS).find(
    ([, label]) => label.toLowerCase() === normalizedLabel,
  )

  return matchedEntry?.[0] || ''
}

const permissionMatrix = [
  {
    module: 'Dashboard Access',
    admin: 'Full',
    office: 'Scoped',
    registrar: 'Scoped',
    student: 'Personal',
  },
  {
    module: 'Clearance Requests',
    admin: 'View / Complete / Delete',
    office: 'Review assigned',
    registrar: 'Final decision',
    student: 'Submit / Track',
  },
  {
    module: 'Workflow Offices',
    admin: 'Manage',
    office: 'View own route',
    registrar: 'View',
    student: 'Track only',
  },
  {
    module: 'Reports',
    admin: 'Institutional',
    office: 'Office-only',
    registrar: 'Institutional',
    student: 'None',
  },
  {
    module: 'Profiles',
    admin: 'All accounts',
    office: 'Own profile',
    registrar: 'Own profile',
    student: 'Own profile',
  },
]

export function RoleManagementPage() {
  const { getOffice, profiles, roles, updateProfileRole } = useClearance()
  const [roleFilter, setRoleFilter] = useState(ALL_ROLES)
  const [searchTerm, setSearchTerm] = useState('')
  const [draftRoles, setDraftRoles] = useState({})

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return profiles.filter((profile) => {
      const profileRole = resolveProfileRoleName(profile)
      const matchesRole = roleFilter === ALL_ROLES || profileRole === roleFilter
      const matchesSearch =
        !normalizedSearch ||
        [
          profile.full_name,
          profile.email,
          profile.student_no,
          profile.course,
          getOffice(profile.office_id)?.office_name,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesRole && matchesSearch
    })
  }, [getOffice, profiles, roleFilter, searchTerm])

  function handleDraftRole(profileId, roleName) {
    setDraftRoles((current) => ({
      ...current,
      [profileId]: roleName,
    }))
  }

  function handleSaveRole(profile) {
    const currentRole = resolveProfileRoleName(profile)
    const nextRole = draftRoles[profile.id] || currentRole
    if (nextRole === currentRole) {
      toast('No role changes to save', 'info')
      return
    }

    const result = updateProfileRole({
      profileId: profile.id,
      roleName: nextRole,
    })

    if (result?.error) {
      toast(result.error, 'error')
      return
    }

    setDraftRoles((current) => {
      const next = { ...current }
      delete next[profile.id]
      return next
    })
    toast('User role updated')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Role Management"
        description="Define how each system role behaves, review permission scope across the clearance platform, and assign the appropriate role to each account."
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-5 md:px-6">
          <div>
            <CardTitle className="text-xl">Role Permission Matrix</CardTitle>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A quick reference of how each role is expected to interact with the
              clearance system.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Module</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Office Staff</TableHead>
                <TableHead>Registrar</TableHead>
                <TableHead>System Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map((row, index) => (
                <TableRow
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'}
                  key={row.module}
                >
                  <TableCell className="py-5 font-semibold text-slate-950">
                    {row.module}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-slate-600">
                    {row.student}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-slate-600">
                    {row.office}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-slate-600">
                    {row.registrar}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-slate-600">
                    {row.admin}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <CardTitle className="text-xl">Account Role Assignments</CardTitle>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Search users, review their current access scope, and reassign roles
                from one administrative table.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
              <FilterField label="Search accounts">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name, email, student number, or office"
                    value={searchTerm}
                  />
                </div>
              </FilterField>
              <FilterField label="Role Filter">
                <Select
                  className="h-11"
                  onChange={(event) => setRoleFilter(event.target.value)}
                  value={roleFilter}
                >
                  <option value={ALL_ROLES}>All roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Name</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Office / Scope</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead className="w-[120px] text-right">Save</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length ? (
                filteredProfiles.map((profile, index) => {
                  const currentRole = resolveProfileRoleName(profile)
                  const nextRole = draftRoles[profile.id] || currentRole
                  const hasChanges = nextRole !== currentRole

                  return (
                    <TableRow
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/35'}
                      key={profile.id}
                    >
                      <TableCell className="py-5">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-950">
                            {profile.full_name}
                          </p>
                          <p className="text-xs text-slate-500">{profile.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {ROLE_LABELS[currentRole] || profile.role_label || 'Unassigned'}
                        </span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-slate-800">
                            {profile.office_id
                              ? getOffice(profile.office_id)?.office_name || 'Office assignment'
                              : profile.course || 'General platform access'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {profile.student_no
                              ? `Student No. ${profile.student_no}`
                              : currentRole === ROLES.ADMIN
                                ? 'Platform-wide oversight'
                                : 'Account-level access scope'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Select
                          className="h-11"
                          onChange={(event) => handleDraftRole(profile.id, event.target.value)}
                          value={nextRole}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.name}>
                              {role.label}
                            </option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="py-5 text-right">
                        <Button
                          disabled={!hasChanges}
                          onClick={() => handleSaveRole(profile)}
                          size="sm"
                          type="button"
                          variant={hasChanges ? 'default' : 'outline'}
                        >
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="hover:bg-white">
                  <TableCell className="py-12 text-center" colSpan={5}>
                    <div className="mx-auto max-w-md space-y-2">
                      <p className="text-base font-semibold text-slate-900">
                        No user accounts match the current filters.
                      </p>
                      <p className="text-sm leading-6 text-slate-500">
                        Adjust the search or role filter to show more accounts in the
                        role assignment table.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function FilterField({ children, label }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {children}
    </div>
  )
}
