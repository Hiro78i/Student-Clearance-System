import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  FileText,
  Lock,
  Save,
  Send,
} from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { REQUEST_STATUS } from '@/constants/roles'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { requestedDocumentOptions } from '@/constants/clearance'
import { toast } from '@/lib/alerts'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'

const schema = z
  .object({
    requestDate: z.string().min(1, 'Select the request date.'),
    address: z.string().min(8, 'Enter your complete address.'),
    contactNumber: z.string().min(7, 'Enter a valid contact number.'),
    purpose: z.string().min(12, 'State the purpose of this clearance request.'),
    semester: z.string().min(1, 'Select a semester.'),
    schoolYear: z.string().min(7, 'Enter the school year.'),
    requestedDocuments: z
      .array(z.string())
      .min(1, 'Select at least one requested document or certification.'),
    otherDocument: z.string().optional(),
  })
  .refine(
    (values) =>
      !values.requestedDocuments.includes('Others') ||
      Boolean(values.otherDocument?.trim()),
    {
      message: 'Specify the other requested document.',
      path: ['otherDocument'],
    },
  )

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function SubmitClearanceRequestPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const { createClearanceRequest, getRequest, offices, updateClearanceRequest } =
    useClearance()
  const editingRequestId = searchParams.get('requestId') || ''
  const editingRequest = editingRequestId ? getRequest(editingRequestId) : null
  const isEditingDraft =
    editingRequest?.student_id === profile.id &&
    editingRequest?.status === REQUEST_STATUS.DRAFT
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      requestDate: today(),
      address: '',
      contactNumber: '',
      purpose: 'Release of requested school document and completion of clearance requirements.',
      semester: 'Second Semester',
      schoolYear: '2025-2026',
      requestedDocuments: ['Transcript of Records'],
      otherDocument: '',
    },
  })

  useEffect(() => {
    if (!isEditingDraft) return

    reset({
      requestDate: editingRequest.request_date || today(),
      address: editingRequest.address || '',
      contactNumber: editingRequest.contact_number || '',
      purpose:
        editingRequest.purpose ||
        'Release of requested school document and completion of clearance requirements.',
      semester: editingRequest.semester || 'Second Semester',
      schoolYear: editingRequest.school_year || '2025-2026',
      requestedDocuments:
        editingRequest.requested_documents?.length
          ? editingRequest.requested_documents
          : ['Transcript of Records'],
      otherDocument: editingRequest.other_document || '',
    })
  }, [editingRequest, isEditingDraft, reset])

  const selectedDocuments = useWatch({
    control,
    name: 'requestedDocuments',
  })
  const showOtherDocument = (selectedDocuments || []).includes('Others')

  async function onSubmit(values) {
    try {
      const payload = {
        studentId: profile.id,
        purpose: values.purpose,
        requestDate: values.requestDate,
        address: values.address,
        contactNumber: values.contactNumber,
        semester: values.semester,
        schoolYear: values.schoolYear,
        requestedDocuments: values.requestedDocuments,
        otherDocument: values.otherDocument,
      }

      const result = isEditingDraft
        ? await updateClearanceRequest({
            requestId: editingRequest.id,
            ...payload,
            submit: true,
          })
        : await createClearanceRequest(payload)

      if (result?.error) {
        toast(result.error, 'error')
        return
      }

      const request = result?.data
      if (!request?.id) {
        toast('Submission did not return a valid request ID.', 'error')
        return
      }

      toast(isEditingDraft ? 'Draft submitted for review' : 'Clearance request submitted')
      navigate(`/student/clearance/${request.id}`)
    } catch (error) {
      toast(error?.message || 'Failed to submit clearance request.', 'error')
      console.error('[SubmitClearanceRequestPage] submit failed:', error)
    }
  }

  async function handleSaveDraft() {
    try {
      const values = getValues()
      const draftPayload = {
        studentId: profile.id,
        purpose: values.purpose?.trim() || 'Draft clearance request',
        requestDate: values.requestDate || today(),
        address: values.address?.trim() || '',
        contactNumber: values.contactNumber?.trim() || '',
        semester: values.semester || 'Second Semester',
        schoolYear: values.schoolYear?.trim() || '2025-2026',
        requestedDocuments:
          values.requestedDocuments?.length
            ? values.requestedDocuments
            : ['Transcript of Records'],
        otherDocument: values.otherDocument?.trim() || '',
      }

      const result = isEditingDraft
        ? await updateClearanceRequest({
            requestId: editingRequest.id,
            ...draftPayload,
          })
        : await createClearanceRequest({
              ...draftPayload,
              status: REQUEST_STATUS.DRAFT,
            })

      if (result?.error) {
        toast(result.error, 'error')
        return
      }

      toast(isEditingDraft ? 'Draft changes saved' : 'Draft saved for later', 'info')
      navigate('/student/clearance-status')
    } catch (error) {
      toast(error?.message || 'Failed to save draft.', 'error')
      console.error('[SubmitClearanceRequestPage] save draft failed:', error)
    }
  }

  function onInvalid(formErrors) {
    const firstKey = Object.keys(formErrors || {})[0]
    const firstMessage = Object.values(formErrors || {})[0]?.message
    toast(firstMessage || 'Please complete the required fields before submitting.', 'error')
    if (firstKey) {
      setFocus(firstKey)
      const field = document.querySelector(`[name="${firstKey}"]`)
      if (field && typeof field.scrollIntoView === 'function') {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
    console.warn('[SubmitClearanceRequestPage] validation errors:', formErrors)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Online clearance workflow"
        title={isEditingDraft ? 'Edit Clearance Draft' : 'Submit Clearance Request'}
        description={
          isEditingDraft
            ? 'Update your draft details, save changes, or submit the request when everything is ready for office review.'
            : 'Complete the student request details and route the clearance to all required Mabini Colleges offices for digital approval.'
        }
      />

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <Card>
          <CardHeader>
            <CardTitle>1. Student Information</CardTitle>
            <CardDescription>
              Your institutional record is attached to this request for office verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadOnlyField label="Full Name" value={profile.full_name || ''} />
            <ReadOnlyField label="Student Number" value={profile.student_no || ''} />
            <Field error={errors.requestDate?.message} label="Request Date">
              <Input type="date" {...register('requestDate')} />
            </Field>
            <Field
              className="xl:col-span-2"
              error={errors.address?.message}
              label="Current Address"
            >
              <Input placeholder="Complete residential address" {...register('address')} />
            </Field>
            <ReadOnlyField label="Course / Program" value={profile.course || ''} />
            <Field error={errors.contactNumber?.message} label="Contact Number">
              <Input inputMode="tel" placeholder="09XXXXXXXXX" {...register('contactNumber')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Request Details</CardTitle>
            <CardDescription>
              These details help the Registrar and offices verify the correct clearance period.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <Field error={errors.purpose?.message} label="Purpose">
              <Textarea className="min-h-28" {...register('purpose')} />
            </Field>
            <Field error={errors.semester?.message} label="Semester">
              <Select {...register('semester')}>
                <option>First Semester</option>
                <option>Second Semester</option>
                <option>Summer</option>
              </Select>
            </Field>
            <Field error={errors.schoolYear?.message} label="School Year">
              <Input placeholder="2025-2026" {...register('schoolYear')} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Requested Documents / Certifications</CardTitle>
            <CardDescription>
              Select all documents covered by this clearance request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              control={control}
              name="requestedDocuments"
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {requestedDocumentOptions.map((option) => {
                    const checked = field.value.includes(option)
                    return (
                      <label
                        className={cn(
                          'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60',
                          checked &&
                            'border-blue-600 bg-blue-50 text-blue-950 shadow-md ring-2 ring-blue-100',
                        )}
                        key={option}
                      >
                        <input
                          checked={checked}
                          className="h-4 w-4 accent-blue-700"
                          onChange={(event) => {
                            const nextValue = event.target.checked
                              ? [...field.value, option]
                              : field.value.filter((item) => item !== option)
                            field.onChange(nextValue)
                          }}
                          type="checkbox"
                        />
                        <span>{option}</span>
                        {checked && (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-700" />
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            {errors.requestedDocuments && (
              <p className="text-sm font-medium text-rose-600">
                {errors.requestedDocuments.message}
              </p>
            )}
            {showOtherDocument && (
              <Field error={errors.otherDocument?.message} label="Specify Others">
                <Input placeholder="Enter requested certification or document" {...register('otherDocument')} />
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Clearance Workflow Offices</CardTitle>
            <CardDescription>
              After submission, your request will move through these offices in order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {offices.map((office) => (
              <div
                className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                key={office.id}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-950 text-white">
                    {office.order_no}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{office.office_name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Step {office.order_no} • Awaiting submission
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Will be routed after submission.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-950">Ready to send for review?</p>
                <p className="text-sm leading-6 text-slate-600">
                  Submit when your details are complete. Mabini Colleges offices will
                  receive the request in workflow order, and you can track each update
                  from your student dashboard.
                </p>
                <p className="mt-2 text-xs font-medium text-blue-800">
                  You may save a draft if you still need to confirm your information.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              <Button
                className="min-w-40"
                onClick={handleSaveDraft}
                type="button"
                variant="outline"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button className="min-w-48" disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isEditingDraft ? 'Update & Submit for Review' : 'Submit for Office Review'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
        <Lock className="h-4 w-4 text-slate-400" />
        <span className="truncate">{value || 'On file'}</span>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        From your student profile record.
      </p>
    </div>
  )
}

function Field({ children, className = '', error, label }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  )
}
