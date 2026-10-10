import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useAlerts } from '../../hooks/useAPI'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: alertsData } = useAlerts()
  const announcements = (alertsData?.data || []).filter(a => a.type === 'announcement')

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
        </main>
      </div>
    </div>
  )
}
