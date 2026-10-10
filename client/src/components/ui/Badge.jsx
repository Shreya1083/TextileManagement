import { cn, getStatusColor } from '../../lib/utils'

export function Badge({ status, children, className, dot }) {
  const colorClass = status ? getStatusColor(status) : ''
  const label = status ? status.replace(/_/g, ' ') : children
  return (
    <span className={cn('badge', colorClass, className)}>
      {dot && <span className={cn('badge-dot', dot)} />}
      {label}
    </span>
  )
}
