import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Enter a valid email address.'),
  role: z.enum([ROLES.STUDENT, ROLES.OFFICE, ROLES.REGISTRAR, ROLES.ADMIN]),
  studentNumber: z.string().optional(),
  courseId: z.string().optional(),
  major: z.string().optional(),
  yearLevel: z.string().optional(),
  graduationTerm: z.string().optional(),
  officeId: z.string().optional(),
})

export function UserEditDialog({ user, onOpenChange, open }) {
  const { updateManagedUser, courses, loadingDirectory, offices } = useClearance()
  const [submitError, setSubmitError] = useState('')

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user && open) {
      // Parse existing course string to find courseId and major.
      const matchedCourse = courses.find((c) =>
        user.course?.startsWith(`${c.title} (${c.abbreviation})`),
      )
      const existingMajor =
        matchedCourse && user.course?.includes(' - Major in ')
          ? user.course.split(' - Major in ')[1]
          : ''

      reset({
        fullName: user.full_name || '',
        email: user.email || '',
        role: user.role || ROLES.STUDENT,
        studentNumber: user.student_no || '',
        courseId: matchedCourse?.id || '',
        major: existingMajor,
        yearLevel: user.year_level || '',
        graduationTerm: user.graduation_term || '',
        officeId: user.office_id || '',
      })
      setSubmitError('')
    }
  }, [user, open, reset, courses])

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
    () => offices.filter((o) => UUID_PATTERN.test(o.id)),
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

      await updateManagedUser(user.id, {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        studentNumber: values.studentNumber?.trim() || null,
        course: courseValue || null,
        yearLevel: values.yearLevel?.trim() || null,
        graduationTerm: values.graduationTerm?.trim() || null,
        officeId: isStaff && values.officeId ? values.officeId : null,
      })
      toast('User updated successfully.')
      onOpenChange(false)
    } catch (error) {
      const message = error?.message || 'Unable to update user.'
      setSubmitError(message)
      toast(message, 'error')
    }
  }

  function handleOpenChange(nextOpen) {
    if (isSubmitting) return
    if (!nextOpen) setSubmitError('')
    onOpenChange(nextOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Update profile details for {user?.full_name || 'this user'}.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
              <Input disabled={isSubmitting} type="email" {...register('email')} />
            </Field>
          </div>

          <Field error={errors.role?.message} label="Role">
            <Select disabled={isSubmitting} {...register('role')}>
              <option value={ROLES.STUDENT}>{ROLE_LABELS[ROLES.STUDENT]}</option>
              <option value={ROLES.OFFICE}>{ROLE_LABELS[ROLES.OFFICE]}</option>
              <option value={ROLES.REGISTRAR}>{ROLE_LABELS[ROLES.REGISTRAR]}</option>
              <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
            </Select>
          </Field>

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
                <Input disabled={isSubmitting} placeholder="AY 2025-2026" {...register('graduationTerm')} />
              </Field>
            </div>
          )}

          {isStaff && (
            <div className="space-y-2">
              <Label htmlFor="edit-officeId">Office Assignment</Label>
              <Select
                disabled={isSubmitting || loadingDirectory || !assignableOffices.length}
                id="edit-officeId"
                {...register('officeId')}
              >
                <option value="">Leave unassigned</option>
                {assignableOffices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.office_name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button disabled={isSubmitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="h-4 w-4" />Save Changes</>
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
