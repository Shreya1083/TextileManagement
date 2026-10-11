import { useState, useEffect } from 'react'
import {
  Plus, Search, CreditCard, Eye, EyeOff, Copy, CheckCircle,
  User, Phone, MapPin, Hash, Cpu, Lock, Mail,
  ShieldCheck, AlertTriangle, Edit3, Trash2, UserX, UserCheck,
  Download, Sparkles, Filter, X
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { useToast }   from '../../components/ui/Toast'
import { exportCSV }  from '../../lib/exportUtils'
import { formatCurrencyFull, cn } from '../../lib/utils'
import {
  getStoredWorkers,
  addStoredWorker,
  updateStoredWorker,
  removeOrDeactivateWorker,
} from '../../services/hrStorage'

/* ── helpers ─────────────────────────────────────────────────────────── */
const DEPT_COLORS = {
  Production: 'from-primary-500 to-violet-600',
  QC:         'from-emerald-500 to-teal-600',
  Store:      'from-cyan-500 to-blue-600',
  Admin:      'from-pink-500 to-rose-600',
  Finishing:  'from-amber-500 to-orange-600',
}

function genWorkerId(name, existing = []) {
  const numericIds = existing
    .map(w => {
      const match = (w.id || w.employeeId || '').match(/\d+/)
      return match ? parseInt(match[0], 10) : 0
    })
    .filter(n => !isNaN(n))
  const max = numericIds.length > 0 ? Math.max(...numericIds) : existing.length
  const next = (max + 1).toString().padStart(3, '0')
  return `W-${next}`
}

function genEmail(name) {
  if (!name) return ''
  const first = name.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${first || 'worker'}@everest.com`
}

function genRfid() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
  return `${hex()}:${hex()}:${hex()}:${hex()}`
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} title="Copy"
      className="p-1 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
      {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

/* ── Registration Modal ─────────────────────────────────────────────── */
function WorkerRegisterModal({ open, onClose, existingWorkers, onSaved }) {
  const [step, setStep]                 = useState(1) // 1 = details, 2 = credentials
  const [showPw, setShowPw]             = useState(false)
  const [rfidScanning, setRfidScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg]         = useState('')
  const toast                           = useToast()

  const defaultId = genWorkerId('', existingWorkers)

  const [form, setForm] = useState({
    fullName:    '',
    workerId:    defaultId,
    role:        'Spinner Operator',
    dept:        'Production',
    shift:       'Morning',
    phone:       '',
    address:     '',
    wageBasis:   'daily',
    dailyWage:   650,
    joiningDate: new Date().toISOString().split('T')[0],
    isActive:    true,
    loginEmail:  '',
    loginPass:   'everest@123',
    rfidUid:     genRfid(),
    machineId:   '',
    emergencyContact: '',
  })

  useEffect(() => {
    if (open) {
      const nextId = genWorkerId('', existingWorkers)
      setForm(prev => ({
        ...prev,
        workerId: nextId,
        loginPass: 'everest@123',
        rfidUid: genRfid(),
        joiningDate: new Date().toISOString().split('T')[0],
      }))
      setStep(1)
      setErrorMsg('')
    }
  }, [open, existingWorkers])

  const set = (k, v) => {
    setErrorMsg('')
    setForm(p => ({ ...p, [k]: v }))
  }

  const handleNameBlur = () => {
    if (form.fullName && !form.loginEmail) {
      set('loginEmail', genEmail(form.fullName))
    }
  }

  const simulateScan = () => {
    setRfidScanning(true)
    setTimeout(() => {
      set('rfidUid', genRfid())
      setRfidScanning(false)
    }, 1000)
  }

  const handleSave = () => {
    setErrorMsg('')
    if (!form.fullName.trim()) {
      setErrorMsg('Full Name is required.')
      setStep(1)
      return
    }
    if (!form.workerId.trim()) {
      setErrorMsg('Worker / Employee ID is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const saved = addStoredWorker({
        employeeId:  form.workerId.trim(),
        fullName:    form.fullName.trim(),
        role:        form.role,
        department:  form.dept,
        shift:       form.shift,
        phone:       form.phone.trim(),
        address:     form.address.trim(),
        wageBasis:   form.wageBasis,
        dailyWage:   Number(form.dailyWage) || 0,
        joiningDate: form.joiningDate,
        isActive:    form.isActive,
        loginEmail:  form.loginEmail.trim(),
        loginPass:   form.loginPass,
        rfidUid:     form.rfidUid,
        machineId:   form.machineId.trim(),
        emergencyContact: form.emergencyContact.trim(),
      })

      toast(`Worker ${saved.name} (${saved.id}) registered successfully`, 'success')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register worker')
      toast(err.message || 'Failed to register worker', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register New Worker / Supervisor"
      description="Create worker profile, login credentials, and RFID card"
      size="xl"
    >
      {/* Error alert */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'Personal & Job Details' },
          { n: 2, label: 'Login & RFID Setup'     },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className={cn('flex-1 h-px w-12', step > i ? 'bg-primary-500' : 'bg-zinc-800')} />}
            <button
              type="button"
              onClick={() => step > s.n - 1 && setStep(s.n)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                step === s.n
                  ? 'bg-primary-500/20 border border-primary-500/50 text-primary-300'
                  : step > s.n
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                  : 'text-zinc-600 bg-zinc-800/40 border border-zinc-800',
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                step === s.n ? 'bg-primary-500 text-white' :
                step > s.n   ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400',
              )}>
                {step > s.n ? '✓' : s.n}
              </span>
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="e.g. Mohan Kumar"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)}
                  onBlur={handleNameBlur} />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label">Employee ID <span className="text-red-400">*</span></label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono" placeholder="e.g. W-010"
                  value={form.workerId} onChange={e => set('workerId', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Role / Designation <span className="text-red-400">*</span></label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="Spinner Operator">Spinner Operator</option>
                <option value="Weaver">Weaver</option>
                <option value="Dyer">Dyer</option>
                <option value="Finisher">Finisher</option>
                <option value="Quality Inspector">Quality Inspector</option>
                <option value="Store Keeper">Store Keeper</option>
                <option value="Production Supervisor">Production Supervisor</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Maintenance Tech">Maintenance Tech</option>
                <option value="Helper">Helper</option>
              </select>
            </div>

            <div>
              <label className="label">Department <span className="text-red-400">*</span></label>
              <select className="input" value={form.dept} onChange={e => set('dept', e.target.value)}>
                <option value="Production">Production</option>
                <option value="QC">QC</option>
                <option value="Store">Store</option>
                <option value="Admin">Admin</option>
                <option value="Finishing">Finishing</option>
              </select>
            </div>

            <div>
              <label className="label">Shift <span className="text-red-400">*</span></label>
              <select className="input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                <option value="Morning">Morning (08:00 - 16:30)</option>
                <option value="Afternoon">Afternoon (16:30 - 00:30)</option>
                <option value="Night">Night (00:30 - 08:30)</option>
              </select>
            </div>

            <div>
              <label className="label">Joining Date</label>
              <input className="input" type="date" value={form.joiningDate}
                onChange={e => set('joiningDate', e.target.value)} />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="+91 98XXX XXXXX"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Emergency Contact</label>
              <input className="input" placeholder="Name & Phone"
                value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
            </div>

            <div>
              <label className="label">Wage Basis</label>
              <div className="flex gap-2">
                {['daily','piece-rate'].map(b => (
                  <button key={b} type="button"
                    onClick={() => set('wageBasis', b)}
                    className={cn('flex-1 btn-secondary btn-sm justify-center capitalize',
                      form.wageBasis === b && 'bg-primary-500/15 border-primary-500/50 text-primary-300 font-bold')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{form.wageBasis === 'daily' ? 'Daily Wage (₹)' : 'Rate per Piece (₹)'}</label>
              <input className="input font-mono" type="number" min="0" value={form.dailyWage}
                onChange={e => set('dailyWage', e.target.value)} />
            </div>

            <div>
              <label className="label">Assigned Machine (Optional)</label>
              <div className="relative">
                <Cpu size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono" placeholder="e.g. M-01"
                  value={form.machineId} onChange={e => set('machineId', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Active Status</label>
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => set('isActive', e.target.checked)}
                    className="checkbox"
                  />
                  <span>Active Employee (Eligible for shifts & attendance)</span>
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <label className="label">Residential Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-zinc-500" />
                <textarea className="input pl-9" rows={2} placeholder="Permanent / Local residential address…"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-800">
            <button type="button" className="btn-primary"
              disabled={!form.fullName.trim() || !form.workerId.trim()}
              onClick={() => {
                if (!form.loginEmail) set('loginEmail', genEmail(form.fullName))
                setStep(2)
              }}>
              Next: Login & RFID Credentials →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Login & RFID ── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          {/* Worker ID Badge */}
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-2xl">
            <Hash size={18} className="text-primary-400 shrink-0" />
            <div className="flex-1">
              <p className="text-2xs text-primary-400 uppercase tracking-wider font-bold">Assigned Employee ID</p>
              <p className="text-2xl font-black text-zinc-50 font-mono mt-0.5">{form.workerId}</p>
            </div>
            <CopyButton value={form.workerId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Login Email ID <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono text-xs"
                  value={form.loginEmail} onChange={e => set('loginEmail', e.target.value)}
                  placeholder="name@everest.com" />
              </div>
              <p className="text-2xs text-zinc-600 mt-1">Auto-generated · used for employee portal</p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label">Login Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10 font-mono"
                  value={form.loginPass} onChange={e => set('loginPass', e.target.value)}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* RFID Card UID */}
          <div>
            <label className="label flex items-center gap-1.5">
              <CreditCard size={12} className="text-primary-400" />
              RFID Card UID (Physical Smart Badge)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className="input font-mono pr-10"
                  value={form.rfidUid}
                  onChange={e => set('rfidUid', e.target.value)}
                  placeholder="AA:BB:CC:DD"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CopyButton value={form.rfidUid} />
                </div>
              </div>
              <button type="button" onClick={simulateScan}
                disabled={rfidScanning}
                className={cn('btn-secondary gap-2 shrink-0', rfidScanning && 'animate-pulse')}>
                <CreditCard size={14} />
                {rfidScanning ? 'Scanning Card…' : 'Tap / Scan Card'}
              </button>
            </div>
            <p className="text-2xs text-zinc-600 mt-1.5">
              Supports RC522 & ISO14443A cards. Tap card reader or input manually.
            </p>
          </div>

          {/* Summary Preview */}
          <div className="rounded-2xl border border-zinc-700/60 overflow-hidden bg-zinc-900/60">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-700/40">
              <ShieldCheck size={13} className="text-emerald-400" />
              <p className="text-xs font-semibold text-zinc-300">Credentials Summary</p>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { label: 'Worker ID',    value: form.workerId,   mono: true  },
                { label: 'Full Name',    value: form.fullName || '—', mono: false },
                { label: 'Role / Dept',  value: `${form.role} (${form.dept})`, mono: false },
                { label: 'Login Email',  value: form.loginEmail || '—', mono: true },
                { label: 'Password',     value: form.loginPass,  mono: true  },
                { label: 'RFID UID',     value: form.rfidUid,    mono: true  },
              ].map(r => (
                <div key={r.label} className="bg-zinc-800/60 rounded-xl p-2.5">
                  <p className="text-zinc-600 mb-0.5 text-2xs">{r.label}</p>
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn('font-semibold text-zinc-100 truncate', r.mono && 'font-mono text-xs')}>{r.value}</p>
                    {r.value !== '—' && <CopyButton value={r.value} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-zinc-800">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back to Details</button>
            <button type="button" className="btn-primary gap-2"
              disabled={!form.loginEmail || isSubmitting}
              onClick={handleSave}>
              <ShieldCheck size={14} />
              {isSubmitting ? 'Registering Worker…' : 'Register Worker'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── Edit Worker Modal ──────────────────────────────────────────────── */
function WorkerEditModal({ open, onClose, worker, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (worker) {
      setForm({
        name:             worker.name || '',
        role:             worker.role || 'Spinner Operator',
        department:       worker.department || worker.dept || 'Production',
        shift:            worker.shift || 'Morning',
        phone:            worker.phone || '',
        wageBasis:        worker.wageBasis || worker.basis || 'daily',
        dailyWage:        worker.dailyWage || worker.wage || 650,
        isActive:         worker.isActive !== false,
        machineId:        worker.machineId || '',
        emergencyContact: worker.emergencyContact || '',
        address:          worker.address || '',
      })
    }
  }, [worker])

  if (!worker || !form) return null

  const handleUpdate = () => {
    if (!form.name.trim()) {
      toast('Worker name cannot be empty', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = updateStoredWorker(worker.id, {
        name:             form.name.trim(),
        role:             form.role,
        department:       form.department,
        dept:             form.department,
        shift:            form.shift,
        phone:            form.phone.trim(),
        wageBasis:        form.wageBasis,
        basis:            form.wageBasis,
        dailyWage:        Number(form.dailyWage) || 0,
        wage:             Number(form.dailyWage) || 0,
        isActive:         form.isActive,
        machineId:        form.machineId.trim(),
        emergencyContact: form.emergencyContact.trim(),
        address:          form.address.trim(),
      })

      toast(`Worker ${updated.name} updated successfully`, 'success')
      onSaved?.(updated)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to update worker', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Worker Profile — ${worker.id}`}
      description="Update designation, wages, shift assignment, or active status"
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Full Name</label>
            <input className="input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="label">Employee ID (Fixed)</label>
            <input className="input font-mono bg-zinc-800/40 cursor-not-allowed text-zinc-400"
              value={worker.id} disabled />
          </div>

          <div>
            <label className="label">Role / Designation</label>
            <select className="input" value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="Spinner Operator">Spinner Operator</option>
              <option value="Weaver">Weaver</option>
              <option value="Dyer">Dyer</option>
              <option value="Finisher">Finisher</option>
              <option value="Quality Inspector">Quality Inspector</option>
              <option value="Store Keeper">Store Keeper</option>
              <option value="Production Supervisor">Production Supervisor</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Maintenance Tech">Maintenance Tech</option>
              <option value="Helper">Helper</option>
            </select>
          </div>

          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
              <option value="Production">Production</option>
              <option value="QC">QC</option>
              <option value="Store">Store</option>
              <option value="Admin">Admin</option>
              <option value="Finishing">Finishing</option>
            </select>
          </div>

          <div>
            <label className="label">Shift Assignment</label>
            <select className="input" value={form.shift}
              onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}>
              <option value="Morning">Morning (08:00 - 16:30)</option>
              <option value="Afternoon">Afternoon (16:30 - 00:30)</option>
              <option value="Night">Night (00:30 - 08:30)</option>
            </select>
          </div>

          <div>
            <label className="label">Contact Phone</label>
            <input className="input" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>

          <div>
            <label className="label">Wage Basis</label>
            <div className="flex gap-2">
              {['daily','piece-rate'].map(b => (
                <button key={b} type="button"
                  onClick={() => setForm(p => ({ ...p, wageBasis: b }))}
                  className={cn('flex-1 btn-secondary btn-sm justify-center capitalize',
                    form.wageBasis === b && 'bg-primary-500/15 border-primary-500/50 text-primary-300 font-bold')}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Daily Wage / Piece Rate (₹)</label>
            <input className="input font-mono" type="number" min="0" value={form.dailyWage}
              onChange={e => setForm(p => ({ ...p, dailyWage: e.target.value }))} />
          </div>

          <div className="col-span-2">
            <label className="label">Status</label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="checkbox"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-200">Active Employment Status</p>
                <p className="text-2xs text-zinc-500">Uncheck to mark worker as Inactive without losing historical attendance or wages</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleUpdate} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Worker Remove / Deactivate Confirmation Modal ──────────────────── */
function WorkerRemoveModal({ open, onClose, worker, onDone }) {
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  if (!worker) return null

  const handleConfirm = () => {
    setIsDeleting(true)
    try {
      const res = removeOrDeactivateWorker(worker.id)
      toast(res.message, res.action === 'DEACTIVATED' ? 'info' : 'success')
      onDone?.(worker.id)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to remove worker', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Deactivate or Remove Worker"
      description="Manage worker removal and data retention policy"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1 text-xs text-zinc-300">
            <p className="font-semibold text-amber-300">Action confirmation for {worker.name} ({worker.id})</p>
            <p className="text-zinc-400">
              If this worker has any past attendance, shift records, or wage disbursements,
              they will be safely marked as <strong className="text-zinc-200">Inactive</strong> rather than permanently deleted.
              This preserves audit trails, historical attendance records, and accounting compliance.
            </p>
            <p className="text-zinc-400">
              If no historical records exist, their profile will be permanently removed.
            </p>
          </div>
        </div>

        <div className="p-3 bg-zinc-800/40 rounded-xl space-y-1 text-xs border border-zinc-700/60">
          <div className="flex justify-between text-zinc-400">
            <span>Employee ID:</span>
            <span className="font-mono text-zinc-200">{worker.id}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Department:</span>
            <span className="text-zinc-200">{worker.department || worker.dept}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Designation:</span>
            <span className="text-zinc-200">{worker.role}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Current Status:</span>
            <span className={worker.isActive === false ? 'text-zinc-400' : 'text-emerald-400 font-semibold'}>
              {worker.isActive === false ? 'Inactive' : 'Active'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-danger gap-1.5"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            <Trash2 size={13} />
            {isDeleting ? 'Processing…' : 'Confirm Deactivate / Remove'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main Workers Page ──────────────────────────────────────────────── */
export default function WorkersPage() {
  const toast = useToast()
  const [showAdd, setShowAdd]         = useState(false)
  const [editingWorker, setEditing]   = useState(null)
  const [removingWorker, setRemoving] = useState(null)
  const [search, setSearch]           = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [workers, setWorkers]         = useState(() => getStoredWorkers())

  // Keep state synced with localStorage events
  useEffect(() => {
    const handleUpdate = () => {
      setWorkers(getStoredWorkers())
    }
    window.addEventListener('everest:workers-updated', handleUpdate)
    return () => window.removeEventListener('everest:workers-updated', handleUpdate)
  }, [])

  const reloadWorkers = () => {
    setWorkers(getStoredWorkers())
  }

  // Reactivate worker quick action
  const handleReactivate = (worker) => {
    try {
      updateStoredWorker(worker.id, { isActive: true })
      toast(`Worker ${worker.name} reactivated`, 'success')
      reloadWorkers()
    } catch (err) {
      toast(err.message || 'Failed to reactivate worker', 'error')
    }
  }

  // Export CSV handler
  const handleExportCSV = () => {
    if (!workers || workers.length === 0) {
      toast('No worker records available to export', 'error')
      return
    }

    try {
      const columns = [
        'Worker ID',
        'Full Name',
        'Role / Designation',
        'Department',
        'Shift',
        'Contact Phone',
        'Email',
        'Wage Basis',
        'Daily Wage (INR)',
        'Status',
        'Joining Date',
        'RFID UID',
      ]

      const rows = workers.map(w => [
        w.id || w.employeeId || '',
        w.name || '',
        w.role || '',
        w.department || w.dept || 'Production',
        w.shift || 'Morning',
        w.phone || '',
        w.email || '',
        w.wageBasis || w.basis || 'daily',
        w.dailyWage || w.wage || 650,
        w.isActive === false ? 'INACTIVE' : 'ACTIVE',
        w.joinDate || w.joiningDate || '',
        w.rfidUid || '',
      ])

      exportCSV({
        filename: 'workers_export.csv',
        columns,
        rows,
      })

      toast(`Exported ${rows.length} worker records to workers_export.csv`, 'success')
    } catch (err) {
      toast(`Export failed: ${err.message}`, 'error')
    }
  }

  // Filtering
  const filtered = workers.filter(w => {
    const query = search.toLowerCase()
    const matchesSearch =
      (w.name || '').toLowerCase().includes(query) ||
      (w.role || '').toLowerCase().includes(query) ||
      (w.id || '').toLowerCase().includes(query) ||
      (w.department || w.dept || '').toLowerCase().includes(query)

    const dept = (w.department || w.dept || '').toLowerCase()
    const matchesDept = selectedDept === 'ALL' || dept === selectedDept.toLowerCase()

    const isActive = w.isActive !== false
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive)

    return matchesSearch && matchesDept && matchesStatus
  })

  const totalCount    = workers.length
  const activeCount   = workers.filter(w => w.isActive !== false).length
  const inactiveCount = workers.filter(w => w.isActive === false).length

  return (
    <div className="page-root">
      <PageHeader
        title="Worker & Supervisor Management"
        subtitle={`${activeCount} active · ${inactiveCount} inactive · ${totalCount} total registered`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn-secondary btn-sm gap-1.5"
              title="Download workers list as CSV"
            >
              <Download size={13} />
              Export CSV
            </button>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />Register Worker
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex bg-zinc-800/60 p-1 rounded-xl border border-zinc-700/50 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={cn('px-2.5 py-1 rounded-lg font-medium transition-all',
                statusFilter === 'ALL' ? 'bg-primary-500 text-white shadow' : 'text-zinc-400 hover:text-zinc-200')}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={cn('px-2.5 py-1 rounded-lg font-medium transition-all',
                statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-white shadow' : 'text-zinc-400 hover:text-zinc-200')}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={cn('px-2.5 py-1 rounded-lg font-medium transition-all',
                statusFilter === 'INACTIVE' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Department Select */}
          <select
            className="input-sm text-xs bg-zinc-800/80 border-zinc-700/60"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            <option value="Production">Production</option>
            <option value="QC">QC</option>
            <option value="Store">Store</option>
            <option value="Admin">Admin</option>
            <option value="Finishing">Finishing</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="input-sm pl-9 w-full text-xs"
            placeholder="Search by name, ID, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Workers Grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <UserX size={36} className="mx-auto text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No workers match the selected criteria</p>
          <p className="text-xs text-zinc-500">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(w => {
            const isInactive = w.isActive === false
            const isSupervisor = (w.role || '').toLowerCase().includes('supervisor')
            const dept = w.department || w.dept || 'Production'

            return (
              <div
                key={w.id}
                className={cn(
                  'card-hover p-5 relative flex flex-col justify-between transition-all group',
                  isInactive && 'opacity-65 border-zinc-800 bg-zinc-900/30'
                )}
              >
                <div>
                  {/* Top row: Avatar + Name + ID */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      'w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 shadow',
                      DEPT_COLORS[dept] || 'from-zinc-600 to-zinc-700'
                    )}>
                      {(w.name || 'W').split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-zinc-100 text-sm truncate">{w.name}</p>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{w.role}</p>
                    </div>
                    <span className="font-mono text-2xs text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-zinc-700/50 shrink-0">
                      {w.id}
                    </span>
                  </div>

                  {/* Badges: Status + Supervisor */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {isInactive ? (
                      <span className="badge badge-gray text-2xs">Inactive</span>
                    ) : (
                      <span className="badge badge-green text-2xs">Active</span>
                    )}
                    {isSupervisor && (
                      <span className="badge badge-yellow text-2xs">Supervisor</span>
                    )}
                    <span className={cn('badge text-2xs', DEPT_COLORS[dept] ? 'badge-purple' : 'badge-gray')}>
                      {dept}
                    </span>
                  </div>

                  {/* Details block */}
                  <div className="space-y-2 text-xs border-t border-zinc-800/60 pt-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Shift</span>
                      <span className="text-zinc-300 font-medium">{w.shift || 'Morning'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Daily Wage</span>
                      <span className="text-zinc-300 font-mono">₹{w.dailyWage || w.wage || 650}/day</span>
                    </div>
                    {w.phone && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Contact</span>
                        <span className="text-zinc-400 font-mono text-2xs">{w.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800/60">
                      <span className="text-zinc-500 font-semibold">Net Pay ({w.month || 'Current'})</span>
                      <span className="font-bold text-zinc-100">{formatCurrencyFull(w.net || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Card actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-2xs text-zinc-500">
                    <CreditCard size={11} className={w.rfidUid ? 'text-primary-400' : 'text-zinc-600'} />
                    <span>{w.rfidUid ? 'RFID Active' : 'No RFID'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isInactive ? (
                      <button
                        onClick={() => handleReactivate(w)}
                        className="btn-ghost btn-xs text-emerald-400 hover:bg-emerald-500/10 gap-1"
                        title="Reactivate worker"
                      >
                        <UserCheck size={12} />
                        Reactivate
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditing(w)}
                          className="btn-ghost btn-xs text-zinc-400 hover:text-zinc-200"
                          title="Edit worker profile"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => setRemoving(w)}
                          className="btn-ghost btn-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                          title="Deactivate or remove worker"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Register Modal */}
      <WorkerRegisterModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        existingWorkers={workers}
        onSaved={reloadWorkers}
      />

      {/* Edit Modal */}
      <WorkerEditModal
        open={Boolean(editingWorker)}
        worker={editingWorker}
        onClose={() => setEditing(null)}
        onSaved={reloadWorkers}
      />

      {/* Remove Confirmation Modal */}
      <WorkerRemoveModal
        open={Boolean(removingWorker)}
        worker={removingWorker}
        onClose={() => setRemoving(null)}
        onDone={reloadWorkers}
      />
    </div>
  )
}
