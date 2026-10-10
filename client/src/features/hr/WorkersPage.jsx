import { useState } from 'react'
import {
  Plus, Search, CreditCard, Eye, EyeOff, Copy, CheckCircle,
  User, Briefcase, Phone, MapPin, Hash, Cpu, Lock, Mail,
  ShieldCheck, AlertTriangle, X,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { Badge }      from '../../components/ui/Badge'
import { useWorkers, useCreateWorker } from '../../hooks/useAPI'
import { formatCurrencyFull, cn } from '../../lib/utils'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

/* ── helpers ─────────────────────────────────────────────────────────── */
const DEPT_COLORS = {
  Production: 'from-primary-500 to-violet-600',
  QC:         'from-emerald-500 to-teal-600',
  Store:      'from-cyan-500 to-blue-600',
  Admin:      'from-pink-500 to-rose-600',
}

function genWorkerId(name, existing) {
  const next = (existing.length + 1).toString().padStart(3, '0')
  return `W-${next}`
}

function genEmail(name) {
  return `${name.split(' ')[0].toLowerCase()}@everest.com`
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
    <button type="button" onClick={copy}
      className="p-1 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors">
      {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

/* ── Registration form ──────────────────────────────────────────────── */
function WorkerRegisterModal({ open, onClose, onSave, workers = [] }) {
  const nextId   = genWorkerId('', workers)
  const [step, setStep]         = useState(1) // 1 = details, 2 = credentials
  const [showPw, setShowPw]     = useState(false)
  const [rfidScanning, setRfidScanning] = useState(false)
  const [saved, setSaved]       = useState(false)

  const [form, setForm] = useState({
    fullName:    '',
    role:        'Spinner Operator',
    dept:        'Production',
    shift:       'Morning',
    phone:       '',
    address:     '',
    wageBasis:   'daily',
    dailyWage:   650,
    joiningDate: new Date().toISOString().split('T')[0],
    workerId:    nextId,
    loginEmail:  '',
    loginPass:   'everest@123',
    rfidUid:     genRfid(),
    machineId:   '',
    emergencyContact: '',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

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
    }, 1200)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => { setSaved(false); onSave?.(form); onClose() }, 1800)
  }

  const resetForm = () => {
    setStep(1)
    setSaved(false)
    setForm({
      fullName: '', role: 'Spinner Operator', dept: 'Production',
      shift: 'Morning', phone: '', address: '', wageBasis: 'daily',
      dailyWage: 650, joiningDate: new Date().toISOString().split('T')[0],
      workerId: nextId, loginEmail: '', loginPass: 'everest@123',
      rfidUid: genRfid(), machineId: '', emergencyContact: '',
    })
  }

  return (
    <Modal
      open={open}
      onClose={() => { resetForm(); onClose() }}
      title="Register New Worker"
      description="Create worker profile, login credentials and RFID card"
      size="xl"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'Personal Details' },
          { n: 2, label: 'Login & RFID'     },
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

      {/* ── Step 1: Personal Details ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="e.g. Mohan Kumar"
                  value={form.fullName} onChange={e => set('fullName', e.target.value)}
                  onBlur={handleNameBlur} />
              </div>
            </div>

            <div>
              <label className="label">Role / Designation</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option>Spinner Operator</option>
                <option>Weaver</option>
                <option>Dyer</option>
                <option>Finisher</option>
                <option>Quality Inspector</option>
                <option>Store Keeper</option>
                <option>Supervisor</option>
                <option>Helper</option>
              </select>
            </div>

            <div>
              <label className="label">Department</label>
              <select className="input" value={form.dept} onChange={e => set('dept', e.target.value)}>
                <option>Production</option>
                <option>QC</option>
                <option>Store</option>
                <option>Admin</option>
              </select>
            </div>

            <div>
              <label className="label">Shift</label>
              <select className="input" value={form.shift} onChange={e => set('shift', e.target.value)}>
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
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
              <input className="input" placeholder="Name & phone"
                value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} />
            </div>

            <div>
              <label className="label">Wage Basis</label>
              <div className="flex gap-2">
                {['daily','piece-rate'].map(b => (
                  <button key={b} type="button"
                    onClick={() => set('wageBasis', b)}
                    className={cn('flex-1 btn-secondary btn-sm justify-center capitalize',
                      form.wageBasis === b && 'bg-primary-500/15 border-primary-500/50 text-primary-300')}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{form.wageBasis === 'daily' ? 'Daily Wage (₹)' : 'Rate per piece (₹)'}</label>
              <input className="input font-mono" type="number" value={form.dailyWage}
                onChange={e => set('dailyWage', e.target.value)} />
            </div>

            <div>
              <label className="label">Assigned Machine (optional)</label>
              <div className="relative">
                <Cpu size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono" placeholder="e.g. M-01"
                  value={form.machineId} onChange={e => set('machineId', e.target.value)} />
              </div>
            </div>

            <div className="col-span-2">
              <label className="label">Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-zinc-500" />
                <textarea className="input pl-9" rows={2} placeholder="Home address…"
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" className="btn-primary"
              disabled={!form.fullName}
              onClick={() => setStep(2)}>
              Next: Login & RFID →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Login ID + RFID ── */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">

          {/* Auto-generated Worker ID */}
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-2xl">
            <Hash size={18} className="text-primary-400 shrink-0" />
            <div className="flex-1">
              <p className="text-2xs text-primary-400 uppercase tracking-wider font-bold">Auto-generated Worker ID</p>
              <p className="text-2xl font-black text-zinc-50 font-mono mt-0.5">{form.workerId}</p>
            </div>
            <CopyButton value={form.workerId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Login Email */}
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Login Email ID <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono text-xs"
                  value={form.loginEmail} onChange={e => set('loginEmail', e.target.value)}
                  placeholder="name@everest.com" />
              </div>
              <p className="text-2xs text-zinc-600 mt-1">Auto-filled from name · editable</p>
            </div>

            {/* Password */}
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

          {/* RFID Card */}
          <div>
            <label className="label flex items-center gap-1.5">
              <CreditCard size={12} className="text-primary-400" />
              RFID Card UID
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
                className={cn('btn-secondary gap-2 shrink-0',
                  rfidScanning && 'animate-pulse')}>
                <CreditCard size={14} />
                {rfidScanning ? 'Scanning…' : 'Tap / Scan Card'}
              </button>
            </div>
            <p className="text-2xs text-zinc-600 mt-1.5">
              Hold RFID card to reader — UID auto-fills · or enter manually · supports MFRC522/RC522
            </p>
          </div>

          {/* Credentials preview card */}
          <div className="rounded-2xl border border-zinc-700/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-700/40">
              <ShieldCheck size={13} className="text-emerald-400" />
              <p className="text-xs font-semibold text-zinc-300">Credentials Summary — share with worker</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Worker ID',    value: form.workerId,   mono: true  },
                { label: 'Full Name',    value: form.fullName || '—', mono: false },
                { label: 'Login Email',  value: form.loginEmail || '—', mono: true },
                { label: 'Password',     value: form.loginPass,  mono: true  },
                { label: 'RFID Card UID',value: form.rfidUid,    mono: true  },
                { label: 'Shift',        value: form.shift,      mono: false },
              ].map(r => (
                <div key={r.label} className="bg-zinc-800/60 rounded-xl p-2.5">
                  <p className="text-zinc-600 mb-0.5">{r.label}</p>
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn('font-semibold text-zinc-100 truncate', r.mono && 'font-mono text-xs')}>{r.value}</p>
                    {r.value !== '—' && <CopyButton value={r.value} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 flex gap-2.5">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">Share credentials securely. Worker must change password on first login in production.</p>
          </div>

          <div className="flex justify-between pt-2">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button type="button" className="btn-primary gap-2"
              disabled={!form.loginEmail || !form.rfidUid || saved}
              onClick={handleSave}>
              {saved
                ? <><CheckCircle size={14} className="text-white" />Worker Registered!</>
                : <><ShieldCheck size={14} />Register Worker</>}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── main page ──────────────────────────────────────────────────────── */
export default function WorkersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [search,  setSearch]  = useState('')
  
  const { data: workersData, isLoading, error } = useWorkers()
  const workers = workersData?.data || []
  
  const createWorkerMutation = useCreateWorker()

  const handleSave = async (form) => {
    try {
      await createWorkerMutation.mutateAsync({
        name: form.fullName,
        role: form.role,
        dept: form.dept,
        shift: form.shift,
        basis: form.wageBasis,
        wage: Number(form.dailyWage),
        contact: form.phone,
        rfidUid: form.rfidUid,
        machineId: form.machineId || null,
        workerId: form.workerId,
      })
    } catch (err) {
      console.error('Failed to create worker', err)
    }
  }

  const filtered = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.role?.toLowerCase().includes(search.toLowerCase()) ||
    w.dept?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Workers"
        subtitle={`${workers.length} employees registered`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-sm pl-8 w-44" placeholder="Search workers…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />Register Worker
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(w => (
          <div key={w.id} className="card-hover p-5 cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${DEPT_COLORS[w.dept] || 'from-zinc-600 to-zinc-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {w.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-100 text-sm truncate">{w.name}</p>
                <p className="text-xs text-zinc-500 truncate">{w.role}</p>
              </div>
              <span className="font-mono text-2xs text-zinc-700 group-hover:text-zinc-500 transition-colors">{w.workerId || w.id}</span>
            </div>

            <div className="space-y-2 text-xs border-t border-zinc-800/60 pt-3">
              <div className="flex justify-between">
                <span className="text-zinc-600">Dept</span>
                <span className={`badge ${DEPT_COLORS[w.dept] ? 'badge-purple' : 'badge-gray'}`}>{w.dept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Daily Wage</span>
                <span className="text-zinc-300 font-mono">₹{w.wage}/day</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800/60">
                <span className="text-zinc-500 font-semibold">Net Pay</span>
                <span className="font-bold text-zinc-100">{formatCurrencyFull(w.net || 0)}</span>
              </div>
            </div>

            {/* RFID indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-2xs text-zinc-700 group-hover:text-zinc-500 transition-colors">
              <CreditCard size={11} />
              <span>RFID assigned</span>
            </div>
          </div>
        ))}
      </div>

      <WorkerRegisterModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
        workers={workers}
      />
    </div>
  )
}

