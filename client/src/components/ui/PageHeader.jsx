export function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="page-header">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}
