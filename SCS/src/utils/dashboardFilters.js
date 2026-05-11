export const ALL_COURSES = 'all'

export function getCourseOptions(students = [], catalog = []) {
  return [
    ...new Set([
      ...catalog.map((course) => formatCourseLabel(course)),
      ...students.map((student) => student.course),
    ].filter(Boolean)),
  ].sort()
}

export function filterStudentsByCourse(students = [], course = ALL_COURSES) {
  if (course === ALL_COURSES) return students
  return students.filter((student) => student.course === course)
}

export function filterRequestsByStudents(requests = [], students = []) {
  const studentIds = new Set(students.map((student) => student.id))
  return requests.filter((request) => studentIds.has(request.student_id))
}

export function filterStepsByRequests(steps = [], requests = []) {
  const requestIds = new Set(requests.map((request) => request.id))
  return steps.filter((step) => requestIds.has(step.request_id))
}

export function formatCourseLabel(course) {
  if (!course) return ''
  return `${course.title} (${course.abbreviation})`
}
