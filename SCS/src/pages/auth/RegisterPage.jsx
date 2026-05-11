import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useClearance } from '@/hooks/useClearance'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROLES } from '@/constants/roles'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/alerts'
import { useAuth } from '@/hooks/useAuth'
import mainBg from '@/assets/mainbg.png'
import mabiniLogo from '@/assets/mabinilogo.jpg'

const ACCOUNT_TYPES = {
  STUDENT: ROLES.STUDENT,
  OFFICE: ROLES.OFFICE,
}

const schema = z
  .object({
    accountType: z.enum([ACCOUNT_TYPES.STUDENT, ACCOUNT_TYPES.OFFICE]),
    firstName: z.string().min(1, 'First name is required.'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required.'),
    suffix: z.string().optional(),
    sex: z.string().min(1, 'Sex is required.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.'),
    address: z.string().min(5, 'Address is required.'),
    contactNumber: z.string().min(7, 'Contact number is required.'),
    email: z.string().email('Enter a valid email address.'),
    studentNumber: z.string().optional(),
    courseId: z.string().optional(),
    major: z.string().optional(),
    yearLevel: z.string().optional(),
    departmentCollege: z.string().optional(),
    section: z.string().optional(),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      })
    }

    if (values.accountType !== ACCOUNT_TYPES.STUDENT) {
      return
    }

    if (!/^\d{6}$/.test(values.studentNumber || '')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Student number must be 6 digits, e.g. 142020.',
        path: ['studentNumber'],
      })
    }

    if (!values.courseId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Course / program is required.',
        path: ['courseId'],
      })
    }

    if (!values.yearLevel) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Year level is required.',
        path: ['yearLevel'],
      })
    }

    if (!values.departmentCollege || values.departmentCollege.trim().length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Department / college is required.',
        path: ['departmentCollege'],
      })
    }

    if (!values.section || !values.section.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Section is required.',
        path: ['section'],
      })
    }
  })

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: createAccount } = useAuth()
  const { courses } = useClearance()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: ACCOUNT_TYPES.STUDENT,
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      sex: '',
      dateOfBirth: '',
      address: '',
      contactNumber: '',
      email: '',
      studentNumber: '',
      courseId: '',
      major: '',
      yearLevel: '',
      departmentCollege: '',
      section: '',
      password: '',
      confirmPassword: '',
    },
  })

  const accountType = watch('accountType')
  const isStudentAccount = accountType === ACCOUNT_TYPES.STUDENT
  const selectedCourseId = watch('courseId')
  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  )
  const coursesByDept = useMemo(() => {
    const map = {}
    courses.forEach((course) => {
      if (!map[course.department]) map[course.department] = []
      map[course.department].push(course)
    })
    return Object.entries(map)
  }, [courses])

  useEffect(() => {
    if (selectedCourse && isStudentAccount) {
      setValue('departmentCollege', selectedCourse.department, { shouldValidate: true })
    }
  }, [isStudentAccount, selectedCourse, setValue])

  useEffect(() => {
    if (isStudentAccount) return

    setValue('studentNumber', '')
    setValue('courseId', '')
    setValue('major', '')
    setValue('yearLevel', '')
    setValue('departmentCollege', '')
    setValue('section', '')
  }, [isStudentAccount, setValue])

  async function onSubmit(values) {
    try {
      const courseLabel = selectedCourse
        ? `${selectedCourse.title} (${selectedCourse.abbreviation})`
        : ''
      const courseWithMajor =
        values.major && courseLabel
          ? `${courseLabel} - Major in ${values.major}`
          : courseLabel

      await createAccount({
        accountType: values.accountType,
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth,
        address: values.address,
        contactNumber: values.contactNumber,
        email: values.email,
        password: values.password,
        studentNumber: isStudentAccount ? values.studentNumber : null,
        courseProgram: isStudentAccount ? courseWithMajor : null,
        yearLevel: isStudentAccount ? values.yearLevel : null,
        departmentCollege: isStudentAccount ? values.departmentCollege : null,
        section: isStudentAccount ? values.section : null,
        fullName: [values.firstName, values.middleName, values.lastName, values.suffix]
          .filter(Boolean)
          .join(' '),
      })

      toast(
        isStudentAccount
          ? 'Student account created. You can now sign in.'
          : 'Office staff account created. Wait for the admin to assign your office.',
      )
      navigate('/login')
    } catch (error) {
      toast(error.message || 'Unable to register account', 'error')
    }
  }

  return (
    <main className="relative min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mainBg})` }}
      />
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]" />

      <div className="relative mx-auto w-full max-w-6xl">
        <Card className="border border-slate-200 bg-white shadow-[0_34px_90px_rgba(15,23,42,0.28)] ring-1 ring-white/70">
          <CardHeader className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <img
                  alt="Mabini logo"
                  className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-cover p-1 shadow-sm"
                  src={mabiniLogo}
                />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    Mabini Colleges
                  </p>
                  <CardTitle className="mt-1 text-3xl font-bold tracking-normal text-slate-950">
                    {isStudentAccount ? 'Student Registration' : 'Office Staff Registration'}
                  </CardTitle>
                  <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                    {isStudentAccount
                      ? 'Complete the form below to create your student clearance account.'
                      : 'Create your office staff account first. An administrator will assign your office after registration.'}
                  </CardDescription>
                </div>
              </div>
              <Link
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                to="/login"
              >
                Back to login
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-7" onSubmit={handleSubmit(onSubmit)}>
              <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <h2 className="text-base font-bold text-slate-950">Account Type</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Choose the type of account you need. Office staff accounts start without an assigned office.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isStudentAccount
                        ? 'border-blue-700 bg-blue-50 text-blue-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setValue('accountType', ACCOUNT_TYPES.STUDENT, { shouldValidate: true })}
                    type="button"
                  >
                    <p className="font-semibold">Student</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Includes academic details for submitting clearance requests.
                    </p>
                  </button>
                  <button
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      !isStudentAccount
                        ? 'border-blue-700 bg-blue-50 text-blue-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                    onClick={() => setValue('accountType', ACCOUNT_TYPES.OFFICE, { shouldValidate: true })}
                    type="button"
                  >
                    <p className="font-semibold">Office Staff</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Register now, then wait for an admin to assign your office access.
                    </p>
                  </button>
                </div>
              </section>

              <FormSection title="1. Personal Information">
                <Field error={errors.firstName?.message} label="First Name">
                  <Input {...register('firstName')} />
                </Field>
                <Field error={errors.middleName?.message} label="Middle Name">
                  <Input {...register('middleName')} />
                </Field>
                <Field error={errors.lastName?.message} label="Last Name">
                  <Input {...register('lastName')} />
                </Field>
                <Field error={errors.suffix?.message} label="Suffix">
                  <Input placeholder="Jr., Sr., III" {...register('suffix')} />
                </Field>
                <Field error={errors.sex?.message} label="Sex">
                  <Select {...register('sex')}>
                    <option value="">Select sex</option>
                    <option>Female</option>
                    <option>Male</option>
                  </Select>
                </Field>
                <Field error={errors.dateOfBirth?.message} label="Date of Birth">
                  <Input type="date" {...register('dateOfBirth')} />
                </Field>
                <Field
                  className="lg:col-span-2"
                  error={errors.address?.message}
                  label="Address"
                >
                  <Textarea className="min-h-24" {...register('address')} />
                </Field>
                <Field error={errors.contactNumber?.message} label="Contact Number">
                  <Input {...register('contactNumber')} />
                </Field>
                <Field error={errors.email?.message} label="Email Address">
                  <Input autoComplete="email" type="email" {...register('email')} />
                </Field>
              </FormSection>

              {isStudentAccount ? (
                <FormSection title="2. Academic Information">
                  <Field error={errors.studentNumber?.message} label="Student Number">
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="142020"
                      {...register('studentNumber')}
                    />
                  </Field>
                  <Field error={errors.courseId?.message} label="Course / Program">
                    <Select {...register('courseId')}>
                      <option value="">Select course / program</option>
                      {coursesByDept.map(([department, departmentCourses]) => (
                        <optgroup key={department} label={department}>
                          {departmentCourses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title} ({course.abbreviation})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  </Field>
                  <Field error={errors.yearLevel?.message} label="Year Level">
                    <Select {...register('yearLevel')}>
                      <option value="">Select year level</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>5th Year</option>
                    </Select>
                  </Field>
                  <Field
                    error={errors.departmentCollege?.message}
                    label="Department / College"
                  >
                    <Input
                      readOnly={Boolean(selectedCourse)}
                      className={selectedCourse ? 'cursor-not-allowed bg-slate-100' : ''}
                      placeholder={selectedCourse ? '' : 'Auto-filled from course'}
                      {...register('departmentCollege')}
                    />
                  </Field>
                  {selectedCourse?.majors?.length > 0 && (
                    <Field error={errors.major?.message} label="Major / Specialization">
                      <Select {...register('major')}>
                        <option value="">No specialization</option>
                        {selectedCourse.majors.map((major) => (
                          <option key={major} value={major}>
                            {major}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  )}
                  <Field error={errors.section?.message} label="Section">
                    <Input {...register('section')} />
                  </Field>
                </FormSection>
              ) : (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
                  <h2 className="text-base font-bold text-slate-950">2. Office Assignment</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Your account will be created without an office assignment. After you register,
                    the administrator will review your account and assign the correct office.
                  </p>
                </section>
              )}

              <FormSection title={isStudentAccount ? '3. Account Security' : '3. Account Security'}>
                <Field error={errors.password?.message} label="Password">
                  <PasswordInput
                    autoComplete="new-password"
                    register={register('password')}
                    show={showPassword}
                    toggle={() => setShowPassword((value) => !value)}
                  />
                </Field>
                <Field
                  error={errors.confirmPassword?.message}
                  label="Confirm Password"
                >
                  <PasswordInput
                    autoComplete="new-password"
                    register={register('confirmPassword')}
                    show={showConfirmPassword}
                    toggle={() => setShowConfirmPassword((value) => !value)}
                  />
                </Field>
              </FormSection>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Already registered?{' '}
                  <Link className="font-semibold text-blue-700" to="/login">
                    Sign in
                  </Link>
                </p>
                <Button className="sm:min-w-56" disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your account...
                    </>
                  ) : isStudentAccount ? (
                    'Create student account'
                  ) : (
                    'Create office staff account'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function FormSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  )
}

function PasswordInput({ register, show, toggle, autoComplete }) {
  return (
    <div className="relative">
      <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        autoComplete={autoComplete}
        className="pl-11 pr-12"
        type={show ? 'text' : 'password'}
        {...register}
      />
      <button
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800"
        onClick={toggle}
        type="button"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
