import { REQUEST_STATUS, STEP_STATUS } from '@/constants/roles'
import { Badge } from '@/components/ui/badge'

const variants = {
  [REQUEST_STATUS.DRAFT]: 'outline',
  [REQUEST_STATUS.SUBMITTED]: 'default',
  [REQUEST_STATUS.IN_REVIEW]: 'warning',
  [REQUEST_STATUS.APPROVED]: 'success',
  [REQUEST_STATUS.REJECTED]: 'destructive',
  [REQUEST_STATUS.COMPLETED]: 'success',
  [STEP_STATUS.PENDING]: 'secondary',
  [STEP_STATUS.IN_REVIEW]: 'warning',
  [STEP_STATUS.APPROVED]: 'success',
  [STEP_STATUS.REJECTED]: 'destructive',
  [STEP_STATUS.RETURNED]: 'warning',
  [STEP_STATUS.NOT_APPLICABLE]: 'outline',
  Unread: 'default',
  Read: 'secondary',
}

export function StatusBadge({ status }) {
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
}
