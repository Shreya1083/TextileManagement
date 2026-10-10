import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, ScanLine, Save, Power, UserCheck } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { exportPDF, exportExcel } from '../../lib/exportUtils'
import { useWorkers, useMarkAttendance, useSettings, useUpdateSettings, useCreateNotification } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { Html5QrcodeScanner } from 'html5-qrcode'

const STATUS_CFG = {
  PRESENT:  { label: 'Present',  short: 'P', bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300', icon: CheckCircle2, dot: 'bg-emerald-400' },
  ABSENT:   { label: 'Absent',   short: 'A', bg: 'bg-red-500/15 border-red-500/40',         text: 'text-red-300',     icon: XCircle,      dot: 'bg-red-400'     },
  HALF_DAY: { label: 'Half Day', short: 'H', bg: 'bg-amber-500/15 border-amber-500/40',     text: 'text-amber-300',   icon: Clock,        dot: 'bg-amber-400'   },
}
const CYCLE = ['PRESENT', 'ABSENT', 'HALF_DAY']

export default function AttendancePage() {
  const { user } = useAuth()
  const { data: workersData, isLoading, error } = useWorkers()
  const workers = workersData?.data || []
  const markAttendanceMutation = useMarkAttendance()

  const { data: settingsData } = useSettings()
  const updateSettings = useUpdateSettings()
  const createNotification = useCreateNotification()
  
  const [shift, setShift] = useState('Morning')
  const [att, setAtt] = useState({})
  
  const [showScanner, setShowScanner] = useState(false)
  const isPortalOpen = settingsData?.data?.attendanceOpen

  const togglePortal = async () => {
    try {
      const newState = !isPortalOpen
      await updateSettings.mutateAsync({ attendanceOpen: newState })
      if (newState) {
        await createNotification.mutateAsync({
          type: 'attendance',
          message: 'Attendance Portal is now OPEN. All workers please scan your QR code at the kiosk.',
          severity: 'info',
          author: user?.name
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  // QR Scanner initialization
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } })
      scanner.render((decodedText) => {
        // Find worker by ID
        const worker = workers.find(w => w.workerId === decodedText)
        if (worker) {
          setAtt(prev => ({ ...prev, [decodedText]: 'PRESENT' }))
          alert(`Success: Attendance marked for ${worker.name}`)
          // Optional: pause scanning or close modal
        } else {
          alert('Invalid QR Code: Worker not found')
        }
      }, (error) => { /* ignore */ })
      
      return () => {
        scanner.clear().catch(console.error)
      }
    }
  }, [showScanner, workers])

  const handleSave = async () => {
    try {
      const records = Object.entries(att).map(([workerId, status]) => ({
        workerId,
        status,
        shift
      }))
      await markAttendanceMutation.mutateAsync({
        date: new Date().toISOString().split('T')[0],
        records
      })
      alert('Attendance saved successfully')
    } catch (err) {
      console.error(err)
      alert('Failed to save attendance')
    }
  }

  useEffect(() => {
    if (workers.length > 0 && Object.keys(att).length === 0) {
      setAtt(Object.fromEntries(workers.map(w => [w.workerId, 'PRESENT'])))
    }
  }, [workers])

  const cycle = id => setAtt(p => ({ ...p, [id]: CYCLE[(CYCLE.indexOf(p[id] || 'PRESENT') + 1) % CYCLE.length] }))
  const counts = {
    PRESENT:  Object.values(att).filter(v => v === 'PRESENT').length,
    ABSENT:   Object.values(att).filter(v => v === 'ABSENT').length,
    HALF_DAY: Object.values(att).filter(v => v === 'HALF_DAY').length,
  }

  const handleExportPDF = () => exportPDF({
    title: 'Attendance Sheet',
    subtitle: `${shift} Shift · ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`,
    columns: ['ID', 'Name', 'Role', 'Status'],
    rows: workers.map(w => [w.workerId, w.name, w.role, att[w.workerId]]),
    filename: 'Attendance',
  })
  const handleExportExcel = () => exportExcel({
    filename: 'Attendance', sheetName: 'Attendance',
    columns: ['ID', 'Name', 'Role', 'Status'],
    rows: workers.map(w => [w.workerId, w.name, w.role, att[w.workerId]]),
  })

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Attendance"
        subtitle={`Marked by ${user?.name} · ${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'2-digit', month:'short', year:'numeric' })}`}
        actions={
          <div className="flex gap-2">
            <button 
              className={cn('btn-sm border flex items-center gap-1.5', isPortalOpen ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400')}
              onClick={togglePortal}
              disabled={updateSettings.isPending}
            >
              <Power size={13} /> {isPortalOpen ? 'Close Portal' : 'Open Portal'}
            </button>
            <ExportMenu onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
            <button className="btn-secondary btn-sm" onClick={() => setShowScanner(true)}>
              <ScanLine size={13} />QR Session
            </button>
          </div>
        }
      />

      <Modal open={showScanner} onClose={() => setShowScanner(false)} title="Scan ID Card" description="Workers can scan their QR code to mark attendance" size="md">
        <div className="flex flex-col items-center p-4">
          <div id="reader" className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-800 bg-black"></div>
          <p className="mt-4 text-xs text-zinc-500">Center the QR code in the frame</p>
        </div>
      </Modal>

      {/* Shift picker + summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {['Morning','Afternoon','Night'].map(s => (
            <button key={s} onClick={() => setShift(s)}
              className={cn('btn-secondary btn-sm', shift === s && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 text-xs">
          {Object.entries(STATUS_CFG).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', c.dot)} />
              <span className={c.text}>{counts[k]} {c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Attendance grid */}
      <div className="card overflow-hidden">
        <div className="section-header">
          <p className="section-title">{shift} Shift — {workers.length} workers</p>
          <p className="text-2xs text-zinc-600">Click status to toggle P → A → H</p>
        </div>
        <div className="divide-y divide-zinc-800/40">
          {workers.map(w => {
            const s = att[w.workerId] || 'PRESENT'
            const cfg = STATUS_CFG[s]
            return (
              <div key={w.workerId} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs font-bold">
                    {w.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{w.name}</p>
                    <p className="text-xs text-zinc-600">{w.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => cycle(w.workerId)}
                  className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-150 select-none', cfg.bg, cfg.text)}
                >
                  <cfg.icon size={12} />
                  {cfg.label}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          className="btn-primary gap-2"
          disabled={markAttendanceMutation.isPending}
          onClick={handleSave}
        >
          <Save size={14} />{markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}
