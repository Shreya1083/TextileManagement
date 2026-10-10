import { Inbox } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title = 'No data found', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-4">
        <Icon size={24} className="text-zinc-500" />
      </div>
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
