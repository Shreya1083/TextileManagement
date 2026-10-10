import { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle2, XCircle, Clock, Calendar, Save, CheckCheck,
  FileEdit, History, Download, AlertCircle, Filter, Search,
  UserCheck, ShieldAlert, ArrowUpDown, ChevronRight, X
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { ExportMenu } from '../../components/ui/ExportMenu'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { cn }         from '../../lib/utils'
import { useAuth }    from '../../context/AuthContext'
import { exportPDF, exportExcel, exportCSV } from '../../lib/exportUtils'
import {
  getStoredWorkers,
  getStoredAttendance,
  markBulkAttendance,
  correctAttendanceRecord,
  getSupervisorCanMarkSupervisor,
} from '../../services/hrStorage'

/* ── Status Configurations ─────────────────────────────────────────── */
const STATUS_CFG = {
  PRESENT:  {
    label: 'Present',
    short: 'P',
    bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    activeBg: 'bg-emerald-500 text-white border-emerald-400',
    icon: CheckCircle2,
    dot: 'bg-emerald-400',
    badge: 'badge-green',
  },
  ABSENT:   {
    label: 'Absent',
    short: 'A',
    bg: 'bg-red-500/15 border-red-500/40 text-red-300',
    activeBg: 'bg-red-500 text-white border-red-400',
    icon: XCircle,
    dot: 'bg-red-400',
    badge: 'badge-red',
  },
  HALF_DAY: {
    label: 'Half Day',
    short: 'H',
    bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    activeBg: 'bg-amber-500 text-white border-amber-400',
    icon: Clock,
    dot: 'bg-amber-400',
    badge: 'badge-yellow',
  },
  LEAVE:    {
    label: 'Leave / Off',
    short: 'L',
    bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    activeBg: 'bg-purple-500 text-white border-purple-400',
    icon: Calendar,
    dot: 'bg-purple-400',
    badge: 'badge-purple',
  },
}

const ALL_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']

/* ── Correction Modal ──────────────────────────────────────────────── */
function AttendanceCorrectionModal({ open, onClose, record, onSaved }) {
  const toast = useToast()
  const { user } = useAuth()
  const [newStatus, setNewStatus] = useState(record?.status || 'PRESENT')
  const [reason, setReason]       = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (record) {
      setNewStatus(record.status)
      setReason('')
    }
  }, [record])

  if (!record) return null

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast('Please provide a reason for the attendance correction.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = correctAttendanceRecord({
        recordId: record.id,
        newStatus,
        reason: reason.trim(),
        correctedBy: `${user?.name || 'Supervisor'} (${user?.role || 'supervisor'})`,
      })

      toast(`Attendance corrected for ${record.workerName}`, 'success')
      onSaved?.(updated)
      onClose()
    } catch (err) {
      toast(err.message || 'Correction failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Correct Attendance Record"
      description={`Adjust recorded status with reason for audit trail`}
      size="md"
    >
      <div className="space-y-4">
        {/* Record Overview */}
        <div className="p-3.5 bg-zinc-800/50 rounded-xl border border-zinc-700/60 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Worker:</span>
            <span className="font-semibold text-zinc-100">{record.workerName} ({record.workerId})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Date & Shift:</span>
            <span className="text-zinc-200">{record.date} · {record.shift} Shift</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Currently Marked As:</span>
            <span className={cn('font-bold', STATUS_CFG[record.status]?.bg ? 'text-zinc-200' : '')}>
              {STATUS_CFG[record.status]?.label || record.status}
            </span>
          </div>
        </div>

        {/* New Status Selection */}
        <div>
          <label className="label">Select Corrected Status <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {ALL_STATUSES.map(st => {
              const cfg = STATUS_CFG[st]
              const isSelected = newStatus === st
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setNewStatus(st)}
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all',
                    isSelected
                      ? cfg.activeBg
                      : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  )}
                >
                  <cfg.icon size={14} />
                  <span>{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="label">Reason for Correction <span className="text-red-400">*</span></label>
          <textarea
            className="input"
            rows={3}
            placeholder="e.g. Punch card misread regularized by supervisor, Medical fitness certificate submitted, etc."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <p className="text-2xs text-zinc-500 mt-1">Audit log will record your name, date, and reason.</p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary gap-1.5"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            <FileEdit size={13} />
            {isSubmitting ? 'Saving Correction…' : 'Save Correction'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Attendance Page ──────────────────────────────────────────── */
export default function AttendancePage() {
  const { user } = useAuth()
  const toast    = useToast()

  // Navigation tab: 'MARK' | 'HISTORY'
  const [activeTab, setActiveTab] = useState('MARK')

  // Marking Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [date, setDate]     = useState(todayStr)
  const [shift, setShift]   = useState('Morning')
  const [saved, setSaved]   = useState(false)
  const [search, setSearch] = useState('')

  // Storage data
  const [allWorkers, setAllWorkers]       = useState(() => getStoredWorkers())
  const [allAttendance, setAllAttendance] = useState(() => getStoredAttendance())

  // Can supervisor mark other supervisors?
  const supervisorCanMarkSupervisor = useMemo(() => getSupervisorCanMarkSupervisor(), [])

  // Listen to storage update events
  useEffect(() => {
    const onWorkersUpdated = () => setAllWorkers(getStoredWorkers())
    const onAttendanceUpdated = () => setAllAttendance(getStoredAttendance())

    window.addEventListener('everest:workers-updated', onWorkersUpdated)
    window.addEventListener('everest:attendance-updated', onAttendanceUpdated)
    return () => {
      window.removeEventListener('everest:workers-updated', onWorkersUpdated)
      window.removeEventListener('everest:attendance-updated', onAttendanceUpdated)
    }
  }, [])

  // Active workforce for marking (excluding inactive workers)
  const activeWorkers = useMemo(() => {
    return allWorkers.filter(w => w.isActive !== false)
  }, [allWorkers])

  // Attendance state for currently selected date & shift: { [workerId]: { status, checkInTime, checkOutTime, overtimeHours } }
  const [sheet, setSheet] = useState({})

  // Initialize or re-sync sheet whenever date, shift, or activeWorkers changes
  useEffect(() => {
    const existingForSlot = allAttendance.filter(r => r.date === date && r.shift === shift)
    const existingMap = Object.fromEntries(existingForSlot.map(r => [r.workerId, r]))

    const initial = {}
    activeWorkers.forEach(w => {
      if (existingMap[w.id]) {
        initial[w.id] = {
          status:        existingMap[w.id].status || 'PRESENT',
          checkInTime:   existingMap[w.id].checkInTime || '08:00',
          checkOutTime:  existingMap[w.id].checkOutTime || '17:00',
          overtimeHours: existingMap[w.id].overtimeHours || 0,
        }
      } else {
        initial[w.id] = {
          status:        'PRESENT',
          checkInTime:   '08:00',
          checkOutTime:  '17:00',
          overtimeHours: 0,
        }
      }
    })

    setSheet(initial)
    setSaved(existingForSlot.length > 0)
  }, [date, shift, activeWorkers, allAttendance])

  // Helper to check if a worker row is locked for current user
  const isWorkerLocked = (worker) => {
    const isTargetSupervisor = (worker.role || '').toLowerCase().includes('supervisor')
    const isCurrentUserSupervisor = (user?.role || '').toLowerCase() === 'supervisor'

    if (isCurrentUserSupervisor && isTargetSupervisor && !supervisorCanMarkSupervisor) {
      return true
    }
    return false
  }

  // Row update helpers
  const updateWorkerField = (workerId, field, value) => {
    setSaved(false)
    setSheet(prev => ({
      ...prev,
      [workerId]: {
        ...(prev[workerId] || { status: 'PRESENT', checkInTime: '08:00', checkOutTime: '17:00', overtimeHours: 0 }),
        [field]: value,
      },
    }))
  }

  const markAll = (status) => {
    setSaved(false)
    setSheet(prev => {
      const next = { ...prev }
      activeWorkers.forEach(w => {
        if (!isWorkerLocked(w)) {
          next[w.id] = { ...(next[w.id] || {}), status }
        }
      })
      return next
    })
    toast(`All markable workers set to ${STATUS_CFG[status]?.label}`, 'info')
  }

  // Summary counts for current sheet
  const counts = useMemo(() => {
    const res = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, LEAVE: 0 }
    Object.values(sheet).forEach(entry => {
      if (res[entry.status] !== undefined) res[entry.status]++
    })
    return res
  }, [sheet])

  // Save current attendance
  const handleSave = () => {
    try {
      const recordsToSave = []

      for (const w of activeWorkers) {
        if (isWorkerLocked(w)) continue
        const item = sheet[w.id] || { status: 'PRESENT', checkInTime: '08:00', checkOutTime: '17:00', overtimeHours: 0 }
        recordsToSave.push({
          workerId:      w.id,
          status:        item.status,
          checkInTime:   item.checkInTime,
          checkOutTime:  item.checkOutTime,
          overtimeHours: item.overtimeHours,
        })
      }

      markBulkAttendance({
        date,
        shift,
        records: recordsToSave,
        markedBy: `${user?.name || 'Supervisor'} (${user?.role || 'supervisor'})`,
        markedByRole: user?.role,
      })

      setSaved(true)
      toast(`Attendance saved for ${date} (${shift} Shift) — ${counts.PRESENT}P, ${counts.ABSENT}A, ${counts.HALF_DAY}H, ${counts.LEAVE}L`, 'success')
    } catch (err) {
      toast(err.message || 'Failed to save attendance', 'error')
    }
  }

  // ── History View Filtering ──
  const [historySearch, setHistorySearch] = useState('')
  const [historyDept,   setHistoryDept]   = useState('ALL')
  const [historyStatus, setHistoryStatus] = useState('ALL')
  const [historyDate,   setHistoryDate]   = useState('')
  const [correctingRecord, setCorrectingRecord] = useState(null)

  const filteredHistory = useMemo(() => {
    return allAttendance.filter(r => {
      const q = historySearch.toLowerCase()
      const matchesSearch =
        (r.workerName || '').toLowerCase().includes(q) ||
        (r.workerId || '').toLowerCase().includes(q) ||
        (r.workerRole || '').toLowerCase().includes(q)

      const matchesDept = historyDept === 'ALL' || (r.department || '').toLowerCase() === historyDept.toLowerCase()
      const matchesStatus = historyStatus === 'ALL' || r.status === historyStatus
      const matchesDate = !historyDate || r.date === historyDate

      return matchesSearch && matchesDept && matchesStatus && matchesDate
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.markedAt || '').localeCompare(a.markedAt || ''))
  }, [allAttendance, historySearch, historyDept, historyStatus, historyDate])

  // ── Exports ──
  const handleExportCSV = () => {
    try {
      if (activeTab === 'MARK') {
        const rows = activeWorkers.map(w => {
          const entry = sheet[w.id] || {}
          return [
            date,
            shift,
            w.id,
            w.name,
            w.department || w.dept || 'Production',
            w.role || '',
            entry.status || 'PRESENT',
            entry.checkInTime || '08:00',
            entry.checkOutTime || '17:00',
            entry.overtimeHours || 0,
            user?.name || 'Supervisor',
          ]
        })

        if (rows.length === 0) {
          toast('No worker records to export', 'error')
          return
        }

        exportCSV({
          filename: `attendance_${date}_${shift}.csv`,
          columns: ['Date', 'Shift', 'Worker ID', 'Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Overtime (Hrs)', 'Marked By'],
          rows,
        })
        toast(`Exported ${rows.length} attendance records`, 'success')
      } else {
        const rows = filteredHistory.map(r => [
          r.date,
          r.shift,
          r.workerId,
          r.workerName,
          r.department || 'Production',
          r.workerRole || '',
          r.status,
          r.checkInTime || '',
          r.checkOutTime || '',
          r.overtimeHours || 0,
          r.markedBy || '',
          r.correctionReason || '',
        ])

        if (rows.length === 0) {
          toast('No attendance history found to export', 'error')
          return
        }

        exportCSV({
          filename: 'attendance_history_export.csv',
          columns: ['Date', 'Shift', 'Worker ID', 'Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Overtime (Hrs)', 'Marked By', 'Correction Reason'],
          rows,
        })
        toast(`Exported ${rows.length} history records`, 'success')
      }
    } catch (err) {
      toast(`Export failed: ${err.message}`, 'error')
    }
  }

  const handleExportPDF = () => {
    const rows = activeTab === 'MARK'
      ? activeWorkers.map(w => [w.id, w.name, w.department || w.dept || 'Production', sheet[w.id]?.status || 'PRESENT'])
      : filteredHistory.map(r => [r.date, r.workerId, r.workerName, r.department || 'Production', r.status])

    return exportPDF({
      title: activeTab === 'MARK' ? `Attendance Sheet — ${shift} Shift` : 'Attendance History Report',
      subtitle: activeTab === 'MARK' ? `${date}` : `Records: ${rows.length}`,
      columns: activeTab === 'MARK' ? ['ID', 'Name', 'Dept', 'Status'] : ['Date', 'ID', 'Name', 'Dept', 'Status'],
      rows,
      filename: `Attendance_${activeTab === 'MARK' ? `${date}_${shift}` : 'History'}`,
    })
  }

  const handleExportExcel = () => {
    const rows = activeTab === 'MARK'
      ? activeWorkers.map(w => [date, shift, w.id, w.name, sheet[w.id]?.status || 'PRESENT', sheet[w.id]?.checkInTime, sheet[w.id]?.checkOutTime, sheet[w.id]?.overtimeHours || 0])
      : filteredHistory.map(r => [r.date, r.shift, r.workerId, r.workerName, r.status, r.checkInTime, r.checkOutTime, r.overtimeHours || 0, r.markedBy, r.correctionReason || ''])

    return exportExcel({
      filename: `Attendance_${activeTab === 'MARK' ? `${date}_${shift}` : 'History'}`,
      sheetName: 'Attendance',
      columns: activeTab === 'MARK'
        ? ['Date', 'Shift', 'ID', 'Name', 'Status', 'In', 'Out', 'OT']
        : ['Date', 'Shift', 'ID', 'Name', 'Status', 'In', 'Out', 'OT', 'Marked By', 'Correction Reason'],
      rows,
    })
  }

  // Filtered workers for marking sheet search
  const visibleMarkingWorkers = activeWorkers.filter(w => {
    const q = search.toLowerCase()
    return (
      (w.name || '').toLowerCase().includes(q) ||
      (w.id || '').toLowerCase().includes(q) ||
      (w.role || '').toLowerCase().includes(q) ||
      (w.department || w.dept || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-root">
      <PageHeader
        title="Attendance & Daily Muster Roll"
        subtitle={`Logged in as ${user?.name} (${user?.role}) · Shift supervisor console`}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        }
      />

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-800">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('MARK')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all',
              activeTab === 'MARK'
                ? 'bg-primary-500 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <UserCheck size={14} />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all',
              activeTab === 'HISTORY'
                ? 'bg-primary-500 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <History size={14} />
            <span>Attendance History & Corrections ({allAttendance.length})</span>
          </button>
        </div>

        {activeTab === 'MARK' && (
          <div className="flex items-center gap-2 text-xs">
            {saved ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
                <CheckCheck size={14} /> Records Saved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                <AlertCircle size={14} /> Unsaved Changes
              </span>
            )}
            <button className="btn-primary btn-sm gap-1.5" onClick={handleSave}>
              <Save size={14} />
              Save Attendance
            </button>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: MARK ATTENDANCE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'MARK' && (
        <div className="space-y-4">
          {/* Controls Bar: Date, Shift, Quick Mark, Counts */}
          <div className="card p-4 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Date & Shift Selectors */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/60 text-xs">
                  <Calendar size={14} className="text-primary-400 shrink-0" />
                  <span className="text-zinc-400 font-medium">Date:</span>
                  <input
                    type="date"
                    value={date}
                    onChange={e => { setDate(e.target.value); setSaved(false) }}
                    className="bg-transparent text-zinc-100 font-semibold focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Shift Selector */}
                <div className="flex gap-1.5 bg-zinc-800/60 p-1 rounded-xl border border-zinc-700/60">
                  {['Morning', 'Afternoon', 'Night'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setShift(s); setSaved(false) }}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                        shift === s
                          ? 'bg-primary-500 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      {s} Shift
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 text-xs bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-700/40">
                  {ALL_STATUSES.map(k => {
                    const c = STATUS_CFG[k]
                    return (
                      <span key={k} className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', c.dot)} />
                        <span className="text-zinc-300 font-semibold">{counts[k] || 0}</span>
                        <span className="text-zinc-500 text-2xs">{c.short}</span>
                      </span>
                    )
                  })}
                </div>

                {/* Quick Mark-all */}
                <div className="flex gap-1">
                  <button onClick={() => markAll('PRESENT')} className="btn-ghost btn-xs text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10">All Present</button>
                  <button onClick={() => markAll('ABSENT')}  className="btn-ghost btn-xs text-red-400 border border-red-500/20 hover:bg-red-500/10">All Absent</button>
                </div>
              </div>
            </div>

            {/* Search Filter inside sheet */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
              <div className="relative w-full sm:w-72">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className="input-sm pl-8 w-full text-xs"
                  placeholder="Filter workers in this shift…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <p className="text-2xs text-zinc-500 hidden sm:block">
                Showing {visibleMarkingWorkers.length} of {activeWorkers.length} active workers
              </p>
            </div>
          </div>

          {/* Attendance Table / Cards */}
          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Worker Details</th>
                    <th>Dept & Shift</th>
                    <th>Attendance Status</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Overtime (Hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMarkingWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-500 text-xs">
                        No active workers found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    visibleMarkingWorkers.map(w => {
                      const item = sheet[w.id] || { status: 'PRESENT', checkInTime: '08:00', checkOutTime: '17:00', overtimeHours: 0 }
                      const locked = isWorkerLocked(w)
                      const isSupervisor = (w.role || '').toLowerCase().includes('supervisor')
                      const isOff = item.status === 'ABSENT' || item.status === 'LEAVE'

                      return (
                        <tr key={w.id} className={cn(locked && 'opacity-60 bg-zinc-900/30')}>
                          {/* Worker Details */}
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs shrink-0">
                                {(w.name || 'W').split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-200 text-sm truncate">{w.name}</span>
                                  {isSupervisor && (
                                    <span className="badge badge-yellow text-2xs">Supervisor</span>
                                  )}
                                </div>
                                <span className="font-mono text-2xs text-zinc-500">{w.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Dept & Role */}
                          <td>
                            <div className="text-xs">
                              <p className="text-zinc-300 font-medium">{w.department || w.dept}</p>
                              <p className="text-zinc-500 text-2xs truncate">{w.role}</p>
                            </div>
                          </td>

                          {/* Status Selector Buttons */}
                          <td>
                            {locked ? (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/25">
                                <ShieldAlert size={13} className="shrink-0" />
                                <span className="text-2xs">Supervisor (Admin permission required)</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
                                {ALL_STATUSES.map(st => {
                                  const cfg = STATUS_CFG[st]
                                  const isSelected = item.status === st
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => updateWorkerField(w.id, 'status', st)}
                                      className={cn(
                                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border select-none',
                                        isSelected
                                          ? cfg.activeBg
                                          : 'border-zinc-800 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                                      )}
                                      title={cfg.label}
                                    >
                                      {cfg.short}
                                    </button>
                                  )
                                })}
                                <span className="text-2xs text-zinc-500 font-medium ml-1">
                                  {STATUS_CFG[item.status]?.label}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* In Time */}
                          <td>
                            <input
                              type="time"
                              disabled={locked || isOff}
                              className={cn(
                                'input-sm font-mono text-xs w-28 bg-zinc-800/80',
                                isOff && 'opacity-40 cursor-not-allowed'
                              )}
                              value={item.checkInTime}
                              onChange={e => updateWorkerField(w.id, 'checkInTime', e.target.value)}
                            />
                          </td>

                          {/* Out Time */}
                          <td>
                            <input
                              type="time"
                              disabled={locked || isOff}
                              className={cn(
                                'input-sm font-mono text-xs w-28 bg-zinc-800/80',
                                isOff && 'opacity-40 cursor-not-allowed'
                              )}
                              value={item.checkOutTime}
                              onChange={e => updateWorkerField(w.id, 'checkOutTime', e.target.value)}
                            />
                          </td>

                          {/* Overtime */}
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="12"
                              step="0.5"
                              disabled={locked || isOff}
                              className={cn(
                                'input-sm font-mono text-xs w-20 bg-zinc-800/80 text-center',
                                isOff && 'opacity-40 cursor-not-allowed'
                              )}
                              value={item.overtimeHours}
                              onChange={e => updateWorkerField(w.id, 'overtimeHours', e.target.value)}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            <div>
              {saved ? (
                <span className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCheck size={14} /> Attendance for {shift} shift on {date} is up to date
                </span>
              ) : (
                <span className="text-xs text-zinc-400">
                  Unsaved entries · Click Save Attendance to commit muster roll
                </span>
              )}
            </div>

            <button className="btn-primary gap-2" onClick={handleSave}>
              <Save size={14} />
              Save Attendance
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: ATTENDANCE HISTORY & CORRECTIONS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4 animate-fade-in">
          {/* History Filters */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Specific Date Filter */}
                <div className="flex items-center gap-2 bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/60 text-xs">
                  <Calendar size={13} className="text-zinc-400" />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={e => setHistoryDate(e.target.value)}
                    className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
                  />
                  {historyDate && (
                    <button onClick={() => setHistoryDate('')} className="text-zinc-500 hover:text-zinc-300">
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  className="input-sm text-xs bg-zinc-800/80 border-zinc-700/60"
                  value={historyStatus}
                  onChange={e => setHistoryStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                </select>

                {/* Department Filter */}
                <select
                  className="input-sm text-xs bg-zinc-800/80 border-zinc-700/60"
                  value={historyDept}
                  onChange={e => setHistoryDept(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  <option value="Production">Production</option>
                  <option value="QC">QC</option>
                  <option value="Store">Store</option>
                  <option value="Admin">Admin</option>
                  <option value="Finishing">Finishing</option>
                </select>
              </div>

              {/* History Search */}
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  className="input-sm pl-8 w-full text-xs"
                  placeholder="Search worker name or ID…"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Date & Shift</th>
                    <th>Worker</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Punch In / Out</th>
                    <th>Overtime</th>
                    <th>Audit / Marked By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-zinc-500 text-xs">
                        No historical attendance records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(rec => {
                      const cfg = STATUS_CFG[rec.status] || STATUS_CFG.PRESENT
                      const hasCorrection = Boolean(rec.correctionReason)

                      return (
                        <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                          {/* Date & Shift */}
                          <td>
                            <div className="text-xs">
                              <p className="font-semibold text-zinc-200">{rec.date}</p>
                              <p className="text-2xs text-zinc-500">{rec.shift} Shift</p>
                            </div>
                          </td>

                          {/* Worker */}
                          <td>
                            <div>
                              <p className="font-semibold text-zinc-200 text-xs">{rec.workerName}</p>
                              <p className="font-mono text-2xs text-zinc-500">{rec.workerId}</p>
                            </div>
                          </td>

                          {/* Dept */}
                          <td>
                            <span className="text-xs text-zinc-400">{rec.department || 'Production'}</span>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={cn('badge', cfg.badge, 'text-2xs font-bold')}>
                              <cfg.icon size={11} />
                              {cfg.label}
                            </span>
                          </td>

                          {/* Punch Timings */}
                          <td>
                            <div className="font-mono text-xs text-zinc-300">
                              {rec.checkInTime || '—'} → {rec.checkOutTime || '—'}
                            </div>
                          </td>

                          {/* Overtime */}
                          <td>
                            <span className="font-mono text-xs text-zinc-400">
                              {rec.overtimeHours ? `${rec.overtimeHours} hrs` : '0 hrs'}
                            </span>
                          </td>

                          {/* Marked By & Correction Trail */}
                          <td>
                            <div className="text-xs max-w-xs space-y-1">
                              <p className="text-zinc-400 text-2xs truncate">
                                By: {rec.markedBy || 'Supervisor'}
                              </p>
                              {hasCorrection && (
                                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-2xs text-amber-300">
                                  <span className="font-semibold">Corrected:</span> {rec.originalStatus} → {rec.status}
                                  <p className="text-zinc-400 italic mt-0.5 truncate">"{rec.correctionReason}"</p>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td>
                            <button
                              onClick={() => setCorrectingRecord(rec)}
                              className="btn-ghost btn-xs text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 gap-1"
                              title="Make correction with reason"
                            >
                              <FileEdit size={12} />
                              Correct
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      <AttendanceCorrectionModal
        open={Boolean(correctingRecord)}
        record={correctingRecord}
        onClose={() => setCorrectingRecord(null)}
        onSaved={() => setAllAttendance(getStoredAttendance())}
      />
    </div>
  )
}
