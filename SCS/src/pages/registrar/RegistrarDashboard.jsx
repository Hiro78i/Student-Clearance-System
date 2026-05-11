import { useState } from 'react'
import { FileCheck2, GraduationCap, UsersRound } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROLES } from '@/constants/roles'
import { useClearance } from '@/hooks/useClearance'
import {
  ALL_COURSES,
  filterRequestsByStudents,
  filterStepsByRequests,
  filterStudentsByCourse,
  getCourseOptions,
} from '@/utils/dashboardFilters'

export function RegistrarDashboard() {
  const [courseFilter, setCourseFilter] = useState(ALL_COURSES)
  const { profiles, requests, steps } = useClearance()
  const students = profiles.filter((profile) => profile.role === ROLES.STUDENT)
  const courseOptions = getCourseOptions(students)
  const filteredStudents = filterStudentsByCourse(students, courseFilter)
  const filteredRequests = filterRequestsByStudents(requests, filteredStudents)
  const filteredSteps = filterStepsByRequests(steps, filteredRequests)
  const registrarSteps = filteredSteps.filter(
    (step) => step.office_id === 'office-registrar',
  )
  const statusData = ['Draft', 'Submitted', 'In Review', 'Rejected', 'Completed'].map(
    (status) => ({
      status,
      total: filteredRequests.filter((request) => request.status === status).length,
    }),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Registrar Workspace"
        title="Registrar Dashboard"
        description="Perform academic verification and finalize student clearance decisions."
      />
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-semibold text-slate-950">Registrar Filters</p>
            <p className="mt-1 text-sm text-slate-500">
              View student records and clearance decisions by course.
            </p>
          </div>
          <div className="w-full space-y-2 sm:w-72">
            <Label htmlFor="registrar-course-filter">Course / Program</Label>
            <Select
              id="registrar-course-filter"
              onChange={(event) => setCourseFilter(event.target.value)}
              value={courseFilter}
            >
              <option value={ALL_COURSES}>All Courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Candidate student records in the portal."
          icon={UsersRound}
          title="Student Records"
          value={filteredStudents.length}
        />
        <StatCard
          description="Clearance requests requiring academic validation."
          icon={GraduationCap}
          title="Registrar Steps"
          tone="amber"
          value={registrarSteps.length}
        />
        <StatCard
          description="Total clearance records under registrar visibility."
          icon={FileCheck2}
          title="Total Requests"
          tone="green"
          value={filteredRequests.length}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request status by course</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={statusData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="status" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
