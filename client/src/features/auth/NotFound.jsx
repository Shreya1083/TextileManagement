import { Link } from 'react-router-dom'
import { Home, ShieldX } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="text-8xl font-black text-zinc-800 mb-3 select-none">404</div>
      <h2 className="text-xl font-bold text-zinc-300 mb-2">Page not found</h2>
      <p className="text-zinc-500 text-sm mb-7 max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary"><Home size={15} />Back to Dashboard</Link>
    </div>
  )
}

export function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mb-4">
        <ShieldX size={28} className="text-red-400" />
      </div>
      <div className="text-8xl font-black text-zinc-800 mb-3 select-none">403</div>
      <h2 className="text-xl font-bold text-zinc-300 mb-2">Access Denied</h2>
      <p className="text-zinc-500 text-sm mb-7 max-w-xs">You don't have permission to view this page. Contact your administrator.</p>
      <Link to="/dashboard" className="btn-primary"><Home size={15} />Back to Dashboard</Link>
    </div>
  )
}
