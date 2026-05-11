import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(value) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatShortDate(value) {
  if (!value) return 'N/A'

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function calculateProgress(steps = []) {
  if (!steps.length) return 0
  const completed = steps.filter((step) =>
    ['Approved', 'Not Applicable'].includes(step.status),
  ).length
  return Math.round((completed / steps.length) * 100)
}

/**
 * Progress that counts only required-office steps.
 * Falls back to all steps when no office metadata is attached.
 */
export function calculateRequiredProgress(steps = []) {
  if (!steps.length) return 0
  const requiredSteps = steps.filter((step) => step.is_required !== false)
  if (!requiredSteps.length) return calculateProgress(steps)
  const completed = requiredSteps.filter((step) =>
    ['Approved', 'Not Applicable'].includes(step.status),
  ).length
  return Math.round((completed / requiredSteps.length) * 100)
}

export function nowIso() {
  return new Date().toISOString()
}

export function peso(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value)
}
