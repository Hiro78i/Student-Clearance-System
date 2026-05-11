import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { ROLE_LABELS, ROLES } from '@/constants/roles'
import { useClearance } from '@/hooks/useClearance'
import { toast } from '@/lib/alerts'

const baseSchema = z.object({
  fullName: z.string().min(3, 'Full name is required.'),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  role: z.enum([ROLES.STUDENT, ROLES.OFFICE, ROLES.REGISTRAR, ROLES.ADMIN]),
  studentNumber: z.string().optional(),
  courseId: z.string().optional(),
  major: z.string().optional(),
  yearLevel: z.string().optional(),
  graduationTerm: z.string().optional(),
  officeId: z.string().optional(),
})

const schema = baseSchema.superRefine((values, context) => {
  if (values.role !== ROLES.STUDENT) {
    return
  }

  if (!values.studentNumber?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Student number is required for student accounts.',
      path: ['studentNumber'],
    })
  }

  if (!values.courseId?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Course / program is required for student accounts.',
      path: ['courseId'],
    })
  }

  if (!values.yearLevel?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Year level is required for student accounts.',
      path: ['yearLevel'],
    })
  }
})

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function UserCreateDialog({ onOpenChange, open }) {
  const { createManagedUser, courses, loadingDirectory, offices } = useClearance()
  const [submitError, setSubmitError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: ROLES.STUDENT,
      studentNumber: '',
      courseId: '',
      major: '',
      yearLevel: '',
      graduationTerm: '',
      officeId: '',
    },
  })

  const selectedRole = watch('role')
  const selectedCourseId = watch('courseId')
  const isStudent = selectedRole === ROLES.STUDENT
  const isStaff = [ROLES.OFFICE, ROLES.REGISTRAR].includes(selectedRole)
  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId],
  )
  const coursesByDept = useMemo(() => {
    const map = {}
    courses.forEach((c) => {
      if (!map[c.department]) map[c.department] = []
      map[c.department].push(c)
    })
    return Object.entries(map)
  }, [courses])
  const assignableOffices = useMemo(
    () => offices.filter((office) => UUID_PATTERN.test(office.id)),
    [offices],
  )

  async function onSubmit(values) {
    setSubmitError('')
    try {
      const courseLabel = selectedCourse
        ? `${selectedCourse.title} (${selectedCourse.abbreviation})`
        : null
      const courseValue = values.major && courseLabel
        ? `${courseLabel} - Major in ${values.major}`
        : courseLabel

      await createManagedUser({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
        studentNumber: values.studentNumber?.trim() || null,
        course: courseValue || null,
        yearLevel: values.yearLevel?.trim() || null,
        graduationTerm: values.graduationTerm?.trim() || null,
        officeId: isStaff && values.officeId ? values.officeId : null,
      })

      toast('User account created successfully.')
      reset()
      setSubmitError('')
      onOpenChange(false)
    } catch (error) {
      const message =
        error?.message ||
        error?.context?.error ||
        error?.context?.message ||
        'Unable to create user account. Please try again.'

      console.error('[UserCreateDialog] createManagedUser failed:', error)
      setSubmitError(message)
      // Also show a toast so it's visible even if the dialog scrolls.
      toast(message, 'error')
    }
  }

  function handleOpenChange(nextOpen) {
    if (isSubmitting) return // block close while request is in-flight
    if (!nextOpen) {
      reset()
      setSubmitError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>Create User Account</DialogTitle>
        <DialogDescription>
          Add a student, staff, registrar, or administrator account to Supabase so
          the user can sign in with the credentials you set here.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* ── Inline error banner ── */}
          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={errors.fullName?.message} label="Full Name">
              <Input disabled={isSubmitting} {...register('fullName')} />
            </Field>
            <Field error={errors.email?.message} label="Email Address">
              <Input
                autoComplete="email"
                disabled={isSubmitting}
                type="email"
                {...register('email')}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field error={errors.password?.message} label="Temporary Password">
              <div className="relative block w-full">
                <input
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  type={showPassword ? 'text' : 'password'}
                  style={{ paddingRight: '2.5rem' }}
                  className="flex min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('password')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field error={errors.role?.message} label="Role">
              <Select disabled={isSubmitting} {...register('role')}>
                <option value={ROLES.STUDENT}>{ROLE_LABELS[ROLES.STUDENT]}</option>
                <option value={ROLES.OFFICE}>{ROLE_LABELS[ROLES.OFFICE]}</option>
                <option value={ROLES.REGISTRAR}>{ROLE_LABELS[ROLES.REGISTRAR]}</option>
                <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
              </Select>
            </Field>
          </div>

          {isStudent && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field error={errors.studentNumber?.message} label="Student Number">
                <Input disabled={isSubmitting} {...register('studentNumber')} />
              </Field>
              <Field error={errors.courseId?.message} label="Course / Program">
                <Select disabled={isSubmitting || !courses.length} {...register('courseId')}>
                  <option value="">Select course / program</option>
                  {coursesByDept.map(([dept, deptCourses]) => (
                    <optgroup key={dept} label={dept}>
                      {deptCourses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.abbreviation})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
              {selectedCourse?.majors?.length > 0 && (
                <Field error={errors.major?.message} label="Major / Specialization">
                  <Select disabled={isSubmitting} {...register('major')}>
                    <option value="">No specialization</option>
                    {selectedCourse.majors.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field error={errors.yearLevel?.message} label="Year Level">
                <Select disabled={isSubmitting} {...register('yearLevel')}>
                  <option value="">Select year level</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>5th Year</option>
                </Select>
              </Field>
              <Field error={errors.graduationTerm?.message} label="Graduation Term">
                <Input
                  disabled={isSubmitting}
                  placeholder="AY 2025-2026"
                  {...register('graduationTerm')}
                />
              </Field>
            </div>
          )}

          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="officeId">Office Assignment</Label>
              <Select
                disabled={isSubmitting || loadingDirectory || !assignableOffices.length}
                id="officeId"
                {...register('officeId')}
              >
                <option value="">Leave unassigned</option>
                {assignableOffices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.office_name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-slate-500">
                Office assignment is optional. You can assign the office later.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ children, error, label }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
