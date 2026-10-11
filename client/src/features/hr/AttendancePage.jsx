import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Save, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { cn } from '../../lib/utils'
import { useWorkers, useMarkAttendance, useAttendance } from '../../hooks/useAPI'

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', short: 'P', color: 'emerald', icon: CheckCircle2 },
  { value: 'ABSENT', label: 'Absent', short: 'A', color: 'red', icon: XCircle },
  { value: 'HALF_DAY', label: 'Half Day', short: 'H', color: 'amber', icon: Clock },
]

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendance, setAttendance] = useState({})
  const [shift, setShift] = useState('Morning')
  
  const dateStr = selectedDate.toISOString().split('T')[0]
  
  const { data: workersData, isLoading: loadingWorkers } = useWorkers()
  const { data: attendanceData, isLoading: loadingAttendance } = useAttendance(dateStr)
  const markMutation = useMarkAttendance()
  
  const workers = workersData?.data || []

  // Initialize attendance from backend
  useEffect(() => {
    if (attendanceData?.data?.record) {
      setAttendance(attendanceData.data.record)
    } else {
      // Default all to PRESENT if no data
      const defaults = {}
      workers.forEach(w => {
        defaults[w.workerId] = 'PRESENT'
      })
      setAttendance(defaults)
    }
  }, [attendanceData, workers])

  const handleStatusChange = (workerId, status) => {
    setAttendance(prev => ({ ...prev, [workerId]: status }))
  }

  const handleSave = async () => {
    try {
      const records = Object.entries(attendance).map(([workerId, status]) => ({
        workerId,
        status,
        shift
      }))
      
      await markMutation.mutateAsync({
        date: dateStr,
        records
      })
      
      alert(`✅ Attendance saved for ${dateStr}`)
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('❌ Failed to save attendance')
    }
  }

  const prevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const nextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  const today = () => {
    setSelectedDate(new Date())
  }

  const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  }

  const summary = {
    present: Object.values(attendance).filter(s => s === 'PRESENT').length,
    absent: Object.values(attendance).filter(s => s === 'ABSENT').length,
    halfDay: Object.values(attendance).filter(s => s === 'HALF_DAY').length,
    total: workers.length
  }

  if (loadingWorkers || loadingAttendance) return <LoadingSpinner />

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Attendance Management"
        subtitle={`Mark attendance for ${selectedDate.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`}
      />

      {/* Date Navigation & Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Date Selector */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Select Date</h3>
            </div>
            <button onClick={today} className="btn-secondary !py-1.5 !px-3 text-xs">
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevDay}
              className="icon-btn"
              title="Previous day"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex-1 text-center">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="input text-center font-semibold"
              />
            </div>

            <button
              onClick={nextDay}
              className="icon-btn"
              title="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Shift Selector */}
          <div className="mt-4">
            <label className="label mb-2">Shift</label>
            <div className="grid grid-cols-3 gap-2">
              {['Morning', 'Afternoon', 'Night'].map(s => (
                <button
                  key={s}
                  onClick={() => setShift(s)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-xs font-medium transition-all border-2',
                    shift === s
                      ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                      : 'border-zinc-700 hover:border-zinc-600 text-zinc-400'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-primary-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Summary</h3>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-zinc-800/40">
              <div className="text-2xl font-bold text-zinc-200">{summary.total}</div>
              <div className="text-xs text-zinc-500 mt-1">Total</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-400">{summary.present}</div>
              <div className="text-xs text-emerald-600 mt-1">Present</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-400">{summary.absent}</div>
              <div className="text-xs text-red-600 mt-1">Absent</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10">
              <div className="text-2xl font-bold text-amber-400">{summary.halfDay}</div>
              <div className="text-xs text-amber-600 mt-1">Half Day</div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={markMutation.isPending}
            className="btn-primary w-full mt-4"
          >
            <Save size={16} />
            {markMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Workers List */}
      <div className="card">
        <div className="p-5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">
            {shift} Shift — {workers.length} Workers
          </h3>
        </div>

        <div className="divide-y divide-zinc-800">
          {workers.map((worker) => {
            const currentStatus = attendance[worker.workerId] || 'PRESENT'
            const statusConfig = getStatusConfig(currentStatus)
            const StatusIcon = statusConfig.icon

            return (
              <div
                key={worker.id}
                className="p-4 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Worker Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white">
                        {worker.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-zinc-200 truncate">
                        {worker.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>{worker.workerId}</span>
                        <span>•</span>
                        <span>{worker.role}</span>
                        <span>•</span>
                        <span>{worker.dept}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex items-center gap-2">
                    {STATUS_OPTIONS.map(option => {
                      const Icon = option.icon
                      const isSelected = currentStatus === option.value

                      return (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(worker.workerId, option.value)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
                            isSelected
                              ? `border-${option.color}-500 bg-${option.color}-500/15`
                              : 'border-zinc-700 hover:border-zinc-600'
                          )}
                          title={option.label}
                        >
                          <Icon
                            size={16}
                            className={cn(
                              isSelected
                                ? `text-${option.color}-400`
                                : 'text-zinc-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              isSelected
                                ? `text-${option.color}-400`
                                : 'text-zinc-400'
                            )}
                          >
                            {option.short}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
