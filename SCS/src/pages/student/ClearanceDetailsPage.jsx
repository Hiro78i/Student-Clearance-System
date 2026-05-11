import { Printer } from 'lucide-react'
import jsPDF from 'jspdf'
import { useParams } from 'react-router-dom'
import { ClearanceTracker } from '@/components/shared/ClearanceTracker'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useClearance } from '@/hooks/useClearance'
import { formatDate } from '@/lib/utils'
import mabiniLogo from '@/assets/mabinilogo.jpg'

export function ClearanceDetailsPage() {
  const { requestId } = useParams()
  const { profile: authProfile } = useAuth()
  const {
    getOffice,
    getProfile,
    getRequest,
    getRequestSteps,
    offices,
    remarks,
  } = useClearance()
  const request = getRequest(requestId)
  const steps = request ? getRequestSteps(request.id) : []
  const requestRemarks = remarks.filter((remark) => remark.request_id === requestId)
  // Use the Supabase profile record if available, fall back to the current
  // authenticated user's profile so the page never crashes on null.
  const student = request
    ? (getProfile(request.student_id) ?? authProfile)
    : authProfile

  if (!request) {
    return (
      <div className="space-y-6">
        <EmptyState
          description="The requested clearance record could not be found. It may still be loading or may have been removed."
          title="Clearance request unavailable"
        />
      </div>
    )
  }

  function drawCheckMark(pdf, centerX, centerY, size = 1.4) {
    pdf.setLineWidth(0.45)
    pdf.line(centerX - size, centerY, centerX - size / 4, centerY + size * 0.9)
    pdf.line(
      centerX - size / 4,
      centerY + size * 0.9,
      centerX + size,
      centerY - size * 0.85,
    )
  }

  function drawCheckBox(pdf, x, y, checked) {
    const box = 3.6
    const top = y - box + 0.8
    pdf.setLineWidth(0.35)
    pdf.rect(x, top, box, box)
    if (checked) drawCheckMark(pdf, x + box / 2, top + box / 2 + 0.1)
  }

  function loadImageAsDataUrl(src) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        context.drawImage(image, 0, 0)
        resolve(canvas.toDataURL('image/jpeg'))
      }
      image.onerror = reject
      image.src = src
    })
  }

  function formatDateOnly(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  }

  async function handleExportPdf() {
    const requestDocuments = request.requested_documents || []
    const isCompleted = request.status === REQUEST_STATUS.COMPLETED

    if (!isCompleted) {
      // Keep the form printable only once workflow is fully complete.
      return
    }

    const docs = {
      diploma: requestDocuments.includes('Diploma'),
      tor: requestDocuments.includes('Transcript of Records'),
      f137: requestDocuments.includes('F137-A'),
      crossReg: requestDocuments.includes('Cross Registration'),
      permit: requestDocuments.includes('Permit to Study'),
      cog: requestDocuments.includes('Certificate of Grades'),
      coe: requestDocuments.includes('Certificate of Enrollment'),
      cue: requestDocuments.includes('Certificate of Units Earned'),
      gwa: requestDocuments.includes('General Weighted Average'),
      others: requestDocuments.includes('Others'),
    }

    const approvalMap = new Map()
    steps.forEach((step) => {
      const approved =
        [STEP_STATUS.APPROVED, STEP_STATUS.NOT_APPLICABLE].includes(step.status)
      approvalMap.set(step.office_id, {
        approved,
        date: approved && step.reviewed_at ? formatDate(step.reviewed_at) : '',
      })
    })

    const officeRows = offices
      .slice()
      .sort((a, b) => a.order_no - b.order_no)
      .map((office) => {
        const officeDecision = approvalMap.get(office.id)
        const checked = officeDecision?.approved
        return {
          approved: Boolean(checked),
          date: formatDateOnly(officeDecision?.date),
          office: office.office_name,
        }
      })

    const doc = new jsPDF({
      format: [330.2, 215.9],
      orientation: 'portrait',
      unit: 'mm',
    })

    const margin = 10
    const pageWidth = 215.9
    let y = 12

    try {
      const logo = await loadImageAsDataUrl(mabiniLogo)
      doc.addImage(logo, 'JPEG', 16, 10, 18, 18)
    } catch {
      // Logo is optional if image loading fails in offline runtime.
    }

    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.text('MABINI COLLEGES, INC.', 108, y, { align: 'center' })
    y += 6
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    doc.text('Daet, Camarines Norte', 108, y, { align: 'center' })
    y += 8
    doc.setFont('times', 'bold')
    doc.setFontSize(13)
    doc.text('APPLICATION FOR CLEARANCE', 108, y, { align: 'center' })
    y += 10

    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.text(`Name: ${student?.full_name || ''}`, margin, y)
    doc.text(`Student Number: ${student?.student_no || ''}`, 82, y)
    doc.text(`Date: ${request.request_date || ''}`, 155, y)
    y += 6
    doc.text(`Address: ${request.address || ''}`, margin, y)
    y += 6
    doc.text(`Course: ${student?.course || ''}`, margin, y)
    doc.text(`Contact Number: ${request.contact_number || ''}`, 120, y)
    y += 8

    doc.setFont('times', 'bold')
    doc.text('REQUESTED DOCUMENTS / CERTIFICATIONS', margin, y)
    y += 6
    doc.setFont('times', 'normal')

    const leftDocs = [
      ['Diploma', docs.diploma],
      ['Transcript of Records', docs.tor],
      ['F137-A', docs.f137],
      ['Cross Registration', docs.crossReg],
      ['Permit to Study', docs.permit],
    ]
    const rightDocs = [
      ['Certificate of Grades', docs.cog],
      ['Certificate of Enrollment', docs.coe],
      ['Certificate of Units Earned', docs.cue],
      ['General Weighted Average', docs.gwa],
      ['Others', docs.others],
    ]

    leftDocs.forEach(([label, checked], index) => {
      const rowY = y + index * 5
      drawCheckBox(doc, margin, rowY, checked)
      doc.text(`${label}`, margin + 5, rowY)
    })
    rightDocs.forEach(([label, checked], index) => {
      const rowY = y + index * 5
      drawCheckBox(doc, 108, rowY, checked)
      doc.text(`${label}`, 113, rowY)
    })
    y += 28

    doc.text(`Purpose: ${request.purpose || ''}`, margin, y)
    y += 6
    doc.text(`Sem: ${request.semester || ''}`, margin, y)
    doc.text(`School Year: ${request.school_year || ''}`, 82, y)
    y += 10

    doc.setFont('times', 'bold')
    doc.text('CLEARANCE CERTIFICATION', 108, y, { align: 'center' })
    y += 6
    doc.setFont('times', 'normal')
    doc.text(
      'I certify that I have been satisfactorily cleared as evidenced by the signatures/checks below.',
      margin,
      y,
    )
    y += 6

    doc.setFont('times', 'bold')
    const tableWidth = 176
    const tableLeft = (pageWidth - tableWidth) / 2
    doc.rect(tableLeft, y, tableWidth, 7)

    const col1 = 106
    const col2 = 32
    const col3 = tableWidth - col1 - col2
    doc.text('OFFICE/DEPARTMENT', tableLeft + 2, y + 5)
    doc.text('APPROVED', tableLeft + col1 + col2 / 2, y + 5, { align: 'center' })
    doc.text('DATE', tableLeft + col1 + col2 + col3 / 2, y + 5, { align: 'center' })
    let rowY = y + 7

    officeRows.forEach((row) => {
      doc.rect(tableLeft, rowY, col1, 7)
      doc.rect(tableLeft + col1, rowY, col2, 7)
      doc.rect(tableLeft + col1 + col2, rowY, col3, 7)
      doc.setFont('times', 'normal')
      doc.text(row.office.toUpperCase(), tableLeft + 2, rowY + 5)
      if (row.approved) {
        drawCheckMark(doc, tableLeft + col1 + col2 / 2, rowY + 3.2, 1.5)
      }
      doc.setFontSize(9)
      doc.text(row.date, tableLeft + col1 + col2 + col3 / 2, rowY + 4.7, { align: 'center' })
      doc.setFontSize(10)
      rowY += 7
    })

    const signatureY = rowY + 20
    const sigRight = tableLeft + tableWidth
    const sigLeft = sigRight - 76
    const sigCenter = (sigLeft + sigRight) / 2
    doc.line(sigLeft, signatureY, sigRight, signatureY)
    doc.text('Signature Over Printed Name', sigCenter, signatureY + 5, { align: 'center' })

    doc.save(`clearance-${(student?.full_name || 'student').replaceAll(' ', '_')}.pdf`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clearance record"
        title={student?.full_name || 'Student clearance record'}
        description="Detailed clearance route, office decisions, and audit-ready remarks."
        actions={
          <Button
            onClick={handleExportPdf}
            type="button"
            variant="outline"
            disabled={request.status !== REQUEST_STATUS.COMPLETED}
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Request Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow label="Student" value={student?.full_name || 'N/A'} />
            <InfoRow label="Student No." value={student?.student_no || 'N/A'} />
            <InfoRow label="Course" value={student?.course || 'N/A'} />
            <InfoRow label="Clearance Type" value={request.clearance_type} />
            <InfoRow label="Request Date" value={request.request_date || 'N/A'} />
            <InfoRow label="Semester" value={request.semester || 'N/A'} />
            <InfoRow label="School Year" value={request.school_year || 'N/A'} />
            <InfoRow label="Contact" value={request.contact_number || 'N/A'} />
            <InfoRow label="Submitted" value={formatDate(request.submitted_at)} />
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500">Status</span>
              <StatusBadge status={request.status} />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Address</p>
              <p className="mt-1 leading-6 text-slate-600">
                {request.address || 'Not provided'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Purpose</p>
              <p className="mt-1 leading-6 text-slate-600">{request.purpose}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                Requested Documents / Certifications
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(request.requested_documents || []).map((document) => (
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    key={document}
                  >
                    {document === 'Others' && request.other_document
                      ? `Others: ${request.other_document}`
                      : document}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <ClearanceTracker getOffice={getOffice} getProfile={getProfile} offices={offices} steps={steps} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Remarks Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requestRemarks.length ? (
            requestRemarks.map((remark) => {
              const office = getOffice(remark.office_id)
              const creator = getProfile(remark.created_by)
              return (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={remark.id}
                >
                  <p className="font-semibold text-slate-950">
                    {office?.office_name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {remark.remarks}
                  </p>
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    {creator?.full_name} • {formatDate(remark.created_at)}
                  </p>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-slate-500">
              No office remarks have been recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-950">{value}</span>
    </div>
  )
}
