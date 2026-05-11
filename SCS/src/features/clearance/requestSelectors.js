export function attachRequestRelations({ requests, steps, profiles, offices }) {
  return requests.map((request) => ({
    ...request,
    student: profiles.find((profile) => profile.id === request.student_id),
    steps: steps
      .filter((step) => step.request_id === request.id)
      .map((step) => ({
        ...step,
        office: offices.find((office) => office.id === step.office_id),
      })),
  }))
}

export function summarizeByStatus(items, statuses) {
  return statuses.map((status) => ({
    status,
    count: items.filter((item) => item.status === status).length,
  }))
}
