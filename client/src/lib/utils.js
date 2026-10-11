import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Convert integer paise to rupees and format with Indian number system.
 * Server always stores money as integer paise (100 paise = ₹1).
 */
export function paiseToCurrency(paise) {
  if (paise == null) return '—'
  return formatCurrency(Math.round(paise) / 100)
}

export function formatCurrency(amount) {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)}L`
  if (amount >= 1_000)       return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatCurrencyFull(amount) {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Format integer paise to full rupee string (₹X,XX,XXX). */
export function paiseFull(paise) {
  if (paise == null) return '—'
  return formatCurrencyFull(Math.round(paise) / 100)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function getStatusColor(status) {
  const map = {
    DRAFT:           'badge-gray',
    CONFIRMED:       'badge-blue',
    YARN_PENDING:    'badge-yellow',
    IN_PRODUCTION:   'badge-purple',
    QUALITY_CHECK:   'badge-orange',
    READY_TO_SHIP:   'badge-teal',
    DISPATCHED:      'badge-blue',
    CLOSED:          'badge-gray',
    RUNNING:         'badge-green',
    IDLE:            'badge-yellow',
    BREAKDOWN:       'badge-red',
    PRODUCED:        'badge-gray',
    AWAITING_QC:     'badge-yellow',
    PASSED:          'badge-green',
    REWORK:          'badge-orange',
    REJECTED:        'badge-red',
    FINISHED_STOCK:  'badge-teal',
    PAID:            'badge-green',
    PARTIAL:         'badge-yellow',
    UNPAID:          'badge-orange',
    OVERDUE:         'badge-red',
    INVOICED:        'badge-blue',
    OK:              'badge-green',
    LOW:             'badge-yellow',
    OUT:             'badge-red',
    OPEN:            'badge-red',
    RAISED:          'badge-primary',
    PARTIALLY_RECEIVED: 'badge-orange',
    RECEIVED:        'badge-green',
  }
  return map[status] || 'badge-gray'
}
