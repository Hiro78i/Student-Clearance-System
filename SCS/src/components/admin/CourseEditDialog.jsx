import { useState } from 'react'
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
import { toast } from '@/lib/alerts'
import { useClearance } from '@/hooks/useClearance'

const categoryOptions = [
  { value: '4-year', label: '4-Year' },
  { value: '2-year', label: '2-Year' },
  { value: 'graduate', label: 'Graduate' },
]

const durationByCategory = {
  '4-year': '4 Years',
  '2-year': '2 Years',
  graduate: 'Graduate Program',
}

export function CourseEditDialog({ course, open, onOpenChange }) {
  const [saving, setSaving] = useState(false)
  const { addCourse, updateCourseDetails } = useClearance()
  const isEditing = Boolean(course)

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData(event.currentTarget)
      const category = formData.get('category')
      const majors = String(formData.get('majors') || '')
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)

      const payload = {
        title: String(formData.get('title') || '').trim(),
        abbreviation: String(formData.get('abbreviation') || '').trim(),
        category,
        durationLabel: durationByCategory[category],
        department: String(formData.get('department') || '').trim(),
        majors,
      }

      if (isEditing) {
        const result = await updateCourseDetails({ courseId: course.id, ...payload })
        if (result?.error) {
          toast(result.error, 'error')
          return
        }
        toast('Course updated')
      } else {
        const result = await addCourse(payload)
        if (result?.error) {
          toast(result.error, 'error')
          return
        }
        toast('Course added')
      }

      onOpenChange(false)
    } catch (error) {
      toast(error?.message || 'Unable to save course. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the academic program details while keeping the structure aligned with the rest of your administrator tools.'
            : 'Create a new academic program entry for the administrator course catalog.'}
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" key={course?.id || 'new-course'} onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-2">
              <Label htmlFor="course-title">Program Title</Label>
              <Input
                defaultValue={course?.title || ''}
                id="course-title"
                name="title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-abbreviation">Abbreviation</Label>
              <Input
                defaultValue={course?.abbreviation || ''}
                id="course-abbreviation"
                name="abbreviation"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="course-category">Category</Label>
              <Select
                defaultValue={course?.category || '4-year'}
                id="course-category"
                name="category"
                required
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-department">Department / College</Label>
              <Input
                defaultValue={course?.department || ''}
                id="course-department"
                name="department"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-majors">Majors / Tracks</Label>
            <Textarea
              defaultValue={course?.majors?.join('\n') || ''}
              id="course-majors"
              name="majors"
              placeholder="One major per line"
            />
            <p className="text-xs leading-5 text-slate-500">
              Enter one major per line. Leave blank if the program has no major track.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              disabled={saving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={saving} type="submit">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
