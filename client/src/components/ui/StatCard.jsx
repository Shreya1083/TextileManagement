import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const ICON_THEMES = {
  blue:    { bg: 'bg-blue-500/15',    icon: 'text-blue-400',    ring: 'ring-blue-500/20'    },
  green:   { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  amber:   { bg: 'bg-amber-500/15',   icon: 'text-amber-400',   ring: 'ring-amber-500/20'   },
  red:     { bg: 'bg-red-500/15',     icon: 'text-red-400',     ring: 'ring-red-500/20'     },
  purple:  { bg: 'bg-purple-500/15',  icon: 'text-purple-400',  ring: 'ring-purple-500/20'  },
  primary: { bg: 'bg-primary-500/15', icon: 'text-primary-400', ring: 'ring-primary-500/20' },
  teal:    { bg: 'bg-teal-500/15',    icon: 'text-teal-400',    ring: 'ring-teal-500/20'    },
  orange:  { bg: 'bg-orange-500/15',  icon: 'text-orange-400',  ring: 'ring-orange-500/20'  },
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  theme = 'primary',
  change,
  changeSuffix = '%',
  footer,
  className,
  accent,
}) {
  const t = ICON_THEMES[theme] || ICON_THEMES.primary
  const isPositive = change > 0
  const isNeutral  = change === 0 || change === undefined

  return (
    <div className={cn(
      'stat-card group hover:border-zinc-700/80 transition-all duration-200',
      className,
    )}>
      {/* Subtle top accent line */}
      {accent && (
        <div className={cn('absolute inset-x-0 top-0 h-[2px] rounded-t-2xl', accent)} />
      )}

      <div className={cn('stat-card-icon ring-1', t.bg, t.ring)}>
        {Icon && <Icon size={19} className={t.icon} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-zinc-200 tracking-wide truncate">
          {title}
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-50 tracking-tight leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
        {change !== undefined && (
          <div className={cn(
            'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold',
            isNeutral
              ? 'bg-zinc-800 text-zinc-500'
              : isPositive
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400',
          )}>
            {isNeutral
              ? <Minus size={10} />
              : isPositive
              ? <TrendingUp size={10} />
              : <TrendingDown size={10} />}
            <span>{isPositive ? '+' : ''}{change}{changeSuffix}</span>
          </div>
        )}
        {footer && <p className="text-xs text-zinc-600 mt-1.5">{footer}</p>}
      </div>
    </div>
  )
}
