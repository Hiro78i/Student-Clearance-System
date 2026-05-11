import { useMemo, useState } from 'react'
import {
  BookOpenText,
  ChevronDown,
  Ellipsis,
  GraduationCap,
  Layers3,
  Pencil,
  Plus,
  Search,
  Shapes,
  Trash2,
} from 'lucide-react'
import { CourseEditDialog } from '@/components/admin/CourseEditDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useClearance } from '@/hooks/useClearance'
import { ROLES } from '@/constants/roles'
import { confirmAction, toast } from '@/lib/alerts'
import { formatCourseLabel } from '@/utils/dashboardFilters'

const ALL_CATEGORIES = 'all'

export function CoursesPage() {
  const [editingCourse, setEditingCourse] = useState(null)
  const [expandedCourseId, setExpandedCourseId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState('')
  const pageSize = 8
  const { courses, coursesError, coursesLoading, deleteCourse, profiles } = useClearance()
  const studentProfiles = profiles.filter((profile) => profile.role === ROLES.STUDENT)
  const rows = useMemo(
    () =>
      courses.map((course) => {
        const label = formatCourseLabel(course)
        const enrolledStudents = studentProfiles.filter(
          (profile) => profile.course === label || profile.course.startsWith(label),
        ).length

        return {
          ...course,
          enrolledStudents,
          label,
          majorsLabel: course.majors.length
            ? course.majors.map((major) => `Major in ${major}`).join(', ')
            : 'No majors listed',
        }
      }),
    [courses, studentProfiles],
  )
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return rows.filter((course) => {
      const matchesCategory =
        categoryFilter === ALL_CATEGORIES || course.category === categoryFilter
      const matchesSearch =
        !normalizedSearch ||
        [
          course.title,
          course.abbreviation,
          course.department,
          ...course.majors,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, rows, searchTerm])
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRows.slice(startIndex, startIndex + pageSize)
  }, [currentPage, filteredRows])

  const fourYearCount = rows.filter((course) => course.category === '4-year').length
  const twoYearCount = rows.filter((course) => course.category === '2-year').length
  const graduateCount = rows.filter((course) => course.category === 'graduate').length

  async function handleDeleteCourse(course) {
    const response = await confirmAction({
      title: 'Delete course?',
      text: `${course.title} will be removed from the catalog if no student profiles are still using it.`,
      confirmButtonText: 'Delete Course',
      icon: 'warning',
    })

    if (!response.isConfirmed) return

    const result = await deleteCourse(course.id)
    if (result.error) {
      toast(result.error, 'error')
      return
    }

    toast('Course deleted')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic catalog"
        title="Courses"
        description="Manage the seeded Mabini Colleges course catalog for undergraduate, diploma, and graduate offerings using the same administrative workspace structure."
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={<BookOpenText className="h-4 w-4" />}
              label="Total Programs"
              value={rows.length}
            />
            <MetricTile
              icon={<GraduationCap className="h-4 w-4" />}
              label="4-Year Courses"
              tone="success"
              value={fourYearCount}
            />
            <MetricTile
              icon={<Layers3 className="h-4 w-4" />}
              label="2-Year Courses"
              tone="warning"
              value={twoYearCount}
            />
            <MetricTile
              icon={<Shapes className="h-4 w-4" />}
              label="Graduate Programs"
              tone="slate"
              value={graduateCount}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-950">Course Catalog</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Review all seeded programs, their academic classification, and
                    available majors inside one administrator-facing directory.
                  </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} type="button">
                  <Plus className="h-4 w-4" />
                  Add Course
                </Button>
              </div>

              <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_12rem_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9"
                    onChange={(event) => {
                      setPage(1)
                      setSearchTerm(event.target.value)
                    }}
                    placeholder="Search program, abbreviation, department, or major..."
                    value={searchTerm}
                  />
                </div>
                <Select
                  aria-label="Filter by course category"
                  onChange={(event) => {
                    setPage(1)
                    setCategoryFilter(event.target.value)
                  }}
                  value={categoryFilter}
                >
                  <option value={ALL_CATEGORIES}>All categories</option>
                  <option value="4-year">4-year</option>
                  <option value="2-year">2-year</option>
                  <option value="graduate">Graduate</option>
                </Select>
                <Button
                  disabled={
                    !searchTerm && categoryFilter === ALL_CATEGORIES
                  }
                  onClick={() => {
                    setPage(1)
                    setSearchTerm('')
                    setCategoryFilter(ALL_CATEGORIES)
                  }}
                  type="button"
                  variant="outline"
                >
                  Clear
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">
                  {filteredRows.length} shown
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                  {rows.reduce((total, course) => total + course.majors.length, 0)} major track(s)
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  {studentProfiles.length} student profile(s)
                </span>
                {coursesLoading && (
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                    Loading from Supabase...
                  </span>
                )}
                {coursesError && (
                  <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">
                    {coursesError}
                  </span>
                )}
              </div>
            </div>

            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[42%]">Program</TableHead>
                    <TableHead className="w-[14%]">Category</TableHead>
                    <TableHead className="hidden w-[18%] lg:table-cell">Department</TableHead>
                    <TableHead className="hidden w-[12%] md:table-cell">Duration</TableHead>
                    <TableHead className="hidden xl:table-cell">Majors</TableHead>
                    <TableHead className="w-[10%] text-center">Students</TableHead>
                    <TableHead className="sticky right-0 z-20 w-16 bg-white text-right shadow-[-10px_0_18px_-18px_rgba(15,23,42,0.45)]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((course, index) => (
                    <CourseTableRow
                      course={course}
                      expanded={expandedCourseId === course.id}
                      index={index}
                      key={course.id}
                      onDelete={handleDeleteCourse}
                      onEdit={(nextCourse) => setEditingCourse(nextCourse)}
                      onToggleExpand={() =>
                        setExpandedCourseId((current) =>
                          current === course.id ? null : course.id,
                        )
                      }
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  ))}
                </TableBody>
            </Table>

            {filteredRows.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Showing{' '}
                  <span className="font-semibold text-slate-900">
                    {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, filteredRows.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-900">{filteredRows.length}</span>{' '}
                  courses
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    type="button"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {!filteredRows.length && (
              <div className="p-4 sm:p-5">
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="font-semibold text-slate-950">
                    No courses match the current filters.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Adjust the category filter or search terms to broaden the catalog
                    view.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CourseEditDialog
        course={editingCourse}
        onOpenChange={(open) => {
          if (!open) setEditingCourse(null)
        }}
        open={Boolean(editingCourse)}
      />
      <CourseEditDialog
        course={null}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />
    </div>
  )
}

function MetricTile({ icon, label, tone = 'default', value }) {
  const toneClass = {
    default: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  }[tone]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-slate-950">{value}</p>
        <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function CategoryBadge({ category }) {
  const categoryLabel = {
    '2-year': '2-Year',
    '4-year': '4-Year',
    graduate: 'Graduate',
  }[category]
  const toneClass = {
    '2-year': 'bg-amber-50 text-amber-700',
    '4-year': 'bg-emerald-50 text-emerald-700',
    graduate: 'bg-blue-50 text-blue-700',
  }[category]

  return (
    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${toneClass}`}>
      {categoryLabel}
    </span>
  )
}

function CourseTableRow({
  course,
  expanded,
  index,
  onDelete,
  onEdit,
  onToggleExpand,
  openMenuId,
  setOpenMenuId,
}) {
  return (
    <>
      <TableRow
        className={`group hover:bg-blue-50/50 ${index % 2 ? 'bg-slate-50/55' : 'bg-white'}`}
      >
        <TableCell className="w-[42%]">
          <div className="flex items-start gap-3">
            <button
              aria-label={expanded ? 'Collapse course details' : 'Expand course details'}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              onClick={onToggleExpand}
              type="button"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-950" title={course.title}>
                {course.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  {course.abbreviation}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Tap for details
                </span>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="min-w-[8rem]">
          <CategoryBadge category={course.category} />
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <p
            className="max-w-[12rem] truncate text-sm font-medium text-slate-700"
            title={course.department}
          >
            {course.department}
          </p>
        </TableCell>
        <TableCell className="hidden md:table-cell text-sm font-semibold text-slate-700">
          {course.duration_label}
        </TableCell>
        <TableCell className="hidden xl:table-cell">
          <p
            className="max-w-[18rem] truncate text-sm leading-6 text-slate-600"
            title={course.majorsLabel}
          >
            {course.majorsLabel}
          </p>
        </TableCell>
        <TableCell className="min-w-[7rem] text-center">
          <span className="inline-flex min-w-10 justify-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
            {course.enrolledStudents}
          </span>
        </TableCell>
        <TableCell className="sticky right-0 z-10 bg-inherit text-right shadow-[-10px_0_18px_-18px_rgba(15,23,42,0.45)] group-hover:bg-blue-50/50">
          <div className="flex justify-end">
            <DropdownMenu open={openMenuId === course.id}>
              <Button
                aria-label={`More actions for ${course.title}`}
                onClick={() => setOpenMenuId(openMenuId === course.id ? null : course.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
              {openMenuId === course.id && (
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      onEdit(course)
                      setOpenMenuId(null)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit course
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      setOpenMenuId(null)
                      onDelete(course)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className={index % 2 ? 'bg-slate-50/55' : 'bg-white'}>
          <TableCell className="px-4 pb-4 pt-0" colSpan={7}>
            <div className="ml-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="grid gap-4 md:grid-cols-3">
                <DetailBlock label="Department" value={course.department} />
                <DetailBlock label="Duration" value={course.duration_label} />
                <DetailBlock
                  label="Students"
                  value={`${course.enrolledStudents} enrolled profile(s)`}
                />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Major Tracks
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {course.majors.length ? (
                    course.majors.map((major) => (
                      <span
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        key={major}
                      >
                        Major in {major}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No majors listed</span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
