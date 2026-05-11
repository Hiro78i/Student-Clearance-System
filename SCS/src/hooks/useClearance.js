import { useContext } from 'react'
import { ClearanceContext } from '@/context/clearance-context'

export function useClearance() {
  const context = useContext(ClearanceContext)
  if (!context) {
    throw new Error('useClearance must be used within ClearanceProvider')
  }
  return context
}
