import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Loader2 } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAlerts } from '../../hooks/useAPI'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: alertsData } = useAlerts()
  const announcements = (alertsData?.data || []).filter(a => a.type === 'announcement')
  const [pageLoading, setPageLoading] = useState(false)
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    if (previousPath.current === location.pathname) return

    previousPath.current = location.pathname
    setPageLoading(true)
    const timeout = window.setTimeout(() => setPageLoading(false), 1000)

    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  return (
    <div className="flex h-full bg-zinc-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Global Announcements Banner */}
        {announcements.map(ann => (
          <div key={ann.id} className="bg-primary-500/10 border-b border-primary-500/20 px-6 py-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                <Bell size={14} className="text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">{ann.message}</p>
                <p className="text-2xs text-zinc-400 mt-0.5">Posted by {ann.author} · {new Date(ann.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-6 py-7 max-w-[1400px] mx-auto">
            <Outlet />
          </div>
          {pageLoading && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/65 backdrop-blur-sm animate-fade-in"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 px-5 py-4 shadow-elevated animate-scale-in">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15">
                  <Loader2 size={21} className="animate-spin text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Loading page</p>
                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    <span className="h-1 w-5 rounded-full bg-primary-400 animate-pulse" />
                    <span className="h-1 w-5 rounded-full bg-primary-400/70 animate-pulse [animation-delay:150ms]" />
                    <span className="h-1 w-5 rounded-full bg-primary-400/40 animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
