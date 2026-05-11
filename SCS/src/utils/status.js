export function isTerminalStatus(status) {
  return ['Approved', 'Rejected', 'Completed'].includes(status)
}

export function needsAction(status) {
  return ['Pending', 'Submitted', 'In Review'].includes(status)
}
