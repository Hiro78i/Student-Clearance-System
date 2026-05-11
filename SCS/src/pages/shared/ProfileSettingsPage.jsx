import {
  Camera,
  GraduationCap,
  Lock,
  Mail,
  Save,
  School,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROLE_LABELS, ROLES } from '@/constants/roles'
import { toast } from '@/lib/alerts'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { LoadingState } from '@/components/shared/LoadingState'

export function ProfileSettingsPage() {
  const { profile, roleLabel } = useAuth()
  const { getOffice } = useClearance()
  if (!profile) return <LoadingState />

  const profileRecord = buildProfileRecord(profile)
  const isStudent = profile.role === ROLES.STUDENT
  const assignedOffice = profile.office_id ? getOffice(profile.office_id) : null
  const profileHighlights = [
    {
      icon: <School className="h-4 w-4" />,
      label: isStudent ? 'Student Number' : 'Assigned Office',
      value: isStudent
        ? profile.student_no || 'Not assigned'
        : assignedOffice?.office_name || 'Not assigned',
    },
    {
      icon: <GraduationCap className="h-4 w-4" />,
      label: isStudent ? 'Program' : 'Position',
      value: isStudent ? profile.course || 'Not assigned' : roleLabel || 'Staff',
    },
    {
      icon: <Mail className="h-4 w-4" />,
      label: 'Email',
      value: profile.email,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isStudent ? 'Student record' : 'Staff record'}
        title={isStudent ? 'My Student Profile' : 'Profile Settings'}
        description={
          isStudent
            ? 'Review your personal, academic, and account information recorded in the Mabini Colleges clearance portal.'
            : 'Review your staff account details and assigned office access in the Mabini Colleges clearance portal.'
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_100%)] px-5 py-6">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/90 bg-blue-950 text-3xl font-black text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.7)]">
                    {profile.avatar_url ? (
                      <img
                        alt={profile.full_name}
                        className="h-full w-full rounded-[28px] object-cover"
                        src={profile.avatar_url}
                      />
                    ) : (
                      getInitials(profile.full_name)
                    )}
                  </div>
                  <p className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                    {profile.full_name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{roleLabel}</p>
                  <Button className="mt-5 min-w-40" type="button" variant="outline">
                    <Camera className="h-4 w-4" />
                    Update Photo
                  </Button>
                  <p className="mt-3 max-w-xs text-xs leading-5 text-slate-600">
                    Profile photos help offices confirm student identity during
                    clearance review.
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-5 py-5">
                {profileHighlights.map((item) => (
                  <OverviewItem
                    icon={item.icon}
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RecordSection
            description="Profile details used for student identity and communication."
            icon={<UserRound className="h-5 w-5" />}
            title="Personal Information"
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <EditableField label="First Name" value={profileRecord.firstName} />
              <EditableField label="Middle Name" value={profileRecord.middleName} />
              <EditableField label="Last Name" value={profileRecord.lastName} />
              <EditableField label="Suffix" placeholder="N/A" value={profileRecord.suffix} />
              <EditableField label="Sex" type="select" value={profileRecord.sex}>
                <option>Female</option>
                <option>Male</option>
                <option>Prefer not to say</option>
              </EditableField>
              <EditableField label="Date of Birth" type="date" value={profileRecord.dateOfBirth} />
              <EditableField
                className="xl:col-span-2"
                label="Contact Number"
                value={profileRecord.contactNumber}
              />
              <EditableField className="md:col-span-2" label="Address" value={profileRecord.address} />
              <EditableField className="md:col-span-2" label="Email Address" value={profile.email} />
            </div>
          </RecordSection>

          <RecordSection
            description="Institutional fields managed by Mabini Colleges records offices."
            icon={<GraduationCap className="h-5 w-5" />}
            title="Academic Information"
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField label="Student Number" value={profile.student_no || 'Not assigned'} />
              <ReadOnlyField label="Course / Program" value={profile.course || 'Not assigned'} />
              <ReadOnlyField label="Year Level" value={profile.year_level || 'Not assigned'} />
              <ReadOnlyField label="Department / College" value={profile.department_college || 'Not assigned'} />
              <ReadOnlyField label="Section" value={profile.section || 'Not assigned'} />
              <ReadOnlyField label="Graduation Term" value={profile.graduation_term || 'Not assigned'} />
            </div>
          </RecordSection>

          <RecordSection
            description="Access information used by the secure clearance portal."
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Account Settings"
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField label="Role" value={ROLE_LABELS[profile.role]} />
              <ReadOnlyField label="Account ID" value={profile.id} />
              <ReadOnlyField label="Profile Created" value={formatDateOnly(profile.created_at)} />
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">Save profile updates</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Editable fields are student-maintained. Locked institutional fields
                  are managed by authorized school offices.
                </p>
              </div>
              <Button onClick={() => toast('Profile saved')} type="button">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </RecordSection>
        </div>
      </div>
    </div>
  )
}

function EditableField({ children, className = '', label, placeholder, type = 'text', value }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {type === 'select' ? (
        <Select className="h-11" defaultValue={value}>{children}</Select>
      ) : (
        <Input className="h-11" defaultValue={value} placeholder={placeholder} type={type} />
      )}
      <p className="text-xs leading-5 text-slate-500">Editable by student</p>
    </div>
  )
}

function OverviewItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:bg-slate-50/70">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
          {value}
        </p>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
        <Lock className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="truncate">{value}</span>
      </div>
      <p className="text-xs leading-5 text-slate-500">Institution-managed</p>
    </div>
  )
}

function RecordSection({ children, description, icon, title }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 pb-5">
        <div className="flex gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            {icon}
          </span>
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 md:p-6">{children}</CardContent>
    </Card>
  )
}

function buildProfileRecord(profile) {
  const parts = (profile.full_name || '').split(' ').filter(Boolean)
  const inferredFirstName = parts[0] || ''
  const inferredLastName = parts.at(-1) || ''
  const inferredMiddleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : ''

  return {
    address: profile.address || '',
    contactNumber: profile.contact_number || '',
    dateOfBirth: profile.date_of_birth || '',
    firstName: profile.first_name || inferredFirstName,
    lastName: profile.last_name || inferredLastName,
    middleName: profile.middle_name || inferredMiddleName,
    sex: profile.sex || '',
    suffix: profile.suffix || '',
  }
}

function formatDateOnly(value) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
