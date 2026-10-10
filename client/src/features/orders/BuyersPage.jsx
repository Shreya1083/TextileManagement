import { useState } from 'react'
import {
  Plus, MapPin, Phone, TrendingUp, Search,
  Mail, Lock, Eye, EyeOff, Copy, CheckCircle,
  Building2, Hash, Globe, FileText, ShieldCheck,
  AlertTriangle, User, CreditCard, Link2, RefreshCw,
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Modal }      from '../../components/ui/Modal'
import { cn }         from '../../lib/utils'
import { useBuyers, useCreateBuyer } from '../../hooks/useAPI'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'

/* ── initial data ────────────────────────────────────────────────────── */
const INITIAL_BUYERS = [
  { id:'B-01', name:'Sharma Fabrics',  city:'Mumbai',    contact:'+91 98000 11111', gstin:'27AABCS1234B1Z1', email:'sharma@everest.com', orders:8, outstanding:107000, type:'Manufacturer' },
  { id:'B-02', name:'Mehta Textiles',  city:'Surat',     contact:'+91 98000 22222', gstin:'24AABCM5678C1Z3', email:'mehta@everest.com',  orders:5, outstanding:0,      type:'Exporter'     },
  { id:'B-03', name:'Patel Exports',   city:'Jaipur',    contact:'+91 98000 33333', gstin:'08AABCP9012D1Z5', email:'patel@everest.com',  orders:4, outstanding:0,      type:'Exporter'     },
  { id:'B-04', name:'Global Garments', city:'Delhi',     contact:'+91 98000 44444', gstin:'07AABCG3456E1Z7', email:'global@everest.com', orders:3, outstanding:0,      type:'Garment'      },
  { id:'B-05', name:'Sunrise Mills',   city:'Ahmedabad', contact:'+91 98000 55555', gstin:'24AABCSR789F1Z9', email:'sunrise@everest.com',orders:6, outstanding:85000,  type:'Manufacturer' },
  { id:'B-06', name:'Kapoor Garments', city:'Ludhiana',  contact:'+91 98000 66666', gstin:'03AABCK2345G1Z1', email:'kapoor@everest.com', orders:2, outstanding:0,      type:'Garment'      },
]

const COLORS = [
  'from-primary-500 to-violet-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-violet-600',
]

/* ── helpers ─────────────────────────────────────────────────────────── */
function genBuyerId(count) {
  return `B-${String(count + 1).padStart(2, '0')}`
}

function genBuyerEmail(name) {
  return `${name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}@everest.com`
}

function genTrackingToken() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy}
      className="p-1 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
      {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

/* ── Registration modal ──────────────────────────────────────────────── */
function BuyerRegisterModal({ open, onClose, onSave, existingCount }) {
  const [step, setStep]     = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [form, setForm] = useState({
    // Company
    companyName:  '',
    contactPerson:'',
    type:         'Manufacturer',
    gstin:        '',
    pan:          '',
    website:      '',
    // Address
    city:         '',
    state:        '',
    pincode:      '',
    address:      '',
    // Contact
    phone:        '',
    altPhone:     '',
    // Login credentials
    buyerId:      genBuyerId(existingCount),
    loginEmail:   '',
    loginPass:    'buyer@123',
    // Secure token for order tracking
    trackingToken: genTrackingToken(),
    // Credit terms
    creditDays:   30,
    creditLimit:  500000,
    paymentTerms: 'Net 30',
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleNameBlur = () => {
    if (form.companyName && !form.loginEmail) {
      set('loginEmail', genBuyerEmail(form.companyName))
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onSave?.({
        id:          form.buyerId,
        name:        form.companyName,
        city:        form.city,
        contact:     form.phone,
        gstin:       form.gstin,
        email:       form.loginEmail,
        orders:      0,
        outstanding: 0,
        type:        form.type,
      })
      onClose()
    }, 1800)
  }

  const reset = () => { setStep(1); setSaved(false) }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Register New Buyer"
      description="Create buyer account with portal login and order tracking access"
      size="xl"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: 'Company Info'  },
          { n: 2, label: 'Contact'       },
          { n: 3, label: 'Login & Access'},
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            {i > 0 && <div className={cn('flex-1 h-px', step > i ? 'bg-primary-500' : 'bg-zinc-800')} />}
            <button type="button"
              onClick={() => step >= s.n && setStep(s.n)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap',
                step === s.n ? 'bg-primary-500/20 border border-primary-500/50 text-primary-300'
                : step > s.n ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
                : 'text-zinc-600 bg-zinc-800/40 border border-zinc-800',
              )}>
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black',
                step === s.n ? 'bg-primary-500 text-white'
                : step > s.n ? 'bg-emerald-500 text-white' : 'bg-zinc-700 text-zinc-400')}>
                {step > s.n ? '✓' : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* ── Step 1: Company Info ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company / Firm Name <span className="text-red-400">*</span></label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="e.g. Sharma Fabrics Pvt Ltd"
                  value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  onBlur={handleNameBlur} />
              </div>
            </div>

            <div>
              <label className="label">Contact Person</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="Owner or manager name"
                  value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Business Type</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                <option>Manufacturer</option>
                <option>Exporter</option>
                <option>Garment</option>
                <option>Retailer</option>
                <option>Wholesaler</option>
                <option>Trader</option>
              </select>
            </div>

            <div>
              <label className="label">GSTIN</label>
              <div className="relative">
                <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono uppercase"
                  placeholder="22AAAAA0000A1Z5" maxLength={15}
                  value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} />
              </div>
            </div>

            <div>
              <label className="label">PAN</label>
              <input className="input font-mono uppercase" placeholder="AAAAA0000A"
                maxLength={10} value={form.pan}
                onChange={e => set('pan', e.target.value.toUpperCase())} />
            </div>

            <div>
              <label className="label">Credit Limit (₹)</label>
              <input className="input font-mono" type="number" value={form.creditLimit}
                onChange={e => set('creditLimit', e.target.value)} />
            </div>

            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                <option>Advance</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
                <option>LC at Sight</option>
              </select>
            </div>

            <div>
              <label className="label">Website (optional)</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="https://example.com"
                  value={form.website} onChange={e => set('website', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-primary"
              disabled={!form.companyName}
              onClick={() => setStep(2)}>
              Next: Contact →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Contact & Address ── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone <span className="text-red-400">*</span></label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="+91 98000 00000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input className="input" placeholder="+91 97000 00000"
                value={form.altPhone} onChange={e => set('altPhone', e.target.value)} />
            </div>
            <div>
              <label className="label">City <span className="text-red-400">*</span></label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9" placeholder="Mumbai"
                  value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="Maharashtra"
                value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div>
              <label className="label">PIN Code</label>
              <input className="input font-mono" placeholder="400001" maxLength={6}
                value={form.pincode} onChange={e => set('pincode', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Full Address</label>
              <textarea className="input" rows={2} placeholder="Street, area, city…"
                value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button type="button" className="btn-primary"
              disabled={!form.phone || !form.city}
              onClick={() => setStep(3)}>
              Next: Login & Access →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Login ID + Tracking Token ── */}
      {step === 3 && (
        <div className="space-y-5 animate-fade-in">

          {/* Auto Buyer ID */}
          <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/25 rounded-2xl">
            <Hash size={18} className="text-primary-400 shrink-0" />
            <div className="flex-1">
              <p className="text-2xs text-primary-400 uppercase tracking-wider font-bold">Auto-generated Buyer ID</p>
              <p className="text-2xl font-black text-zinc-50 font-mono mt-0.5">{form.buyerId}</p>
            </div>
            <CopyButton value={form.buyerId} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Portal Login Email <span className="text-red-400">*</span></label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input className="input pl-9 font-mono text-xs"
                  placeholder="company@everest.com"
                  value={form.loginEmail} onChange={e => set('loginEmail', e.target.value)} />
              </div>
              <p className="text-2xs text-zinc-600 mt-1">Auto-filled from company name · editable</p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label">Login Password <span className="text-red-400">*</span></label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10 font-mono"
                  value={form.loginPass} onChange={e => set('loginPass', e.target.value)} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Secure tracking token */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Link2 size={12} className="text-primary-400" />
              Secure Order Tracking Token
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input className="input font-mono text-xs pr-10"
                  value={form.trackingToken}
                  onChange={e => set('trackingToken', e.target.value)} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CopyButton value={form.trackingToken} />
                </div>
              </div>
              <button type="button"
                onClick={() => set('trackingToken', genTrackingToken())}
                className="btn-secondary gap-1.5 shrink-0 btn-sm">
                <RefreshCw size={13} />Regenerate
              </button>
            </div>
            <p className="text-2xs text-zinc-600 mt-1.5">
              Buyer uses this token at <span className="font-mono text-primary-400">/track</span> to view their order status without a full login
            </p>
          </div>

          {/* Credentials preview */}
          <div className="rounded-2xl border border-zinc-700/60 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 border-b border-zinc-700/40">
              <ShieldCheck size={13} className="text-emerald-400" />
              <p className="text-xs font-semibold text-zinc-300">Buyer Credentials — share with buyer</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Buyer ID',       value: form.buyerId,        mono: true  },
                { label: 'Company',        value: form.companyName,    mono: false },
                { label: 'Login Email',    value: form.loginEmail || '—', mono: true },
                { label: 'Password',       value: form.loginPass,      mono: true  },
                { label: 'Tracking Token', value: form.trackingToken,  mono: true  },
                { label: 'City',           value: form.city || '—',    mono: false },
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
            <p className="text-xs text-amber-300">
              Send login credentials and tracking token to buyer securely. They can track orders at <span className="font-mono">/track</span> without logging in.
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button type="button" className="btn-primary gap-2"
              disabled={!form.loginEmail || saved}
              onClick={handleSave}>
              {saved
                ? <><CheckCircle size={14} />Buyer Registered!</>
                : <><ShieldCheck size={14} />Register Buyer</>}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── main page ──────────────────────────────────────────────────────── */

export default function BuyersPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [search,  setSearch]  = useState('')
  
  const { data: buyersData, isLoading, error } = useBuyers()
  const buyers = buyersData?.data || []
  const createBuyerMutation = useCreateBuyer()

  const handleSave = async (buyer) => {
    try {
      await createBuyerMutation.mutateAsync({
        buyerId: buyer.buyerId,
        name: buyer.companyName,
        email: buyer.loginEmail,
        phone: buyer.phone,
        address: buyer.address,
        city: buyer.city,
        state: buyer.state,
        pincode: buyer.pincode,
        type: buyer.type,
        gstin: buyer.gstin,
        pan: buyer.pan,
        creditLimit: Number(buyer.creditLimit),
        paymentTerms: buyer.paymentTerms,
      })
    } catch (err) {
      console.error('Failed to register buyer', err)
    }
  }

  const filtered = buyers.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="page-root"><LoadingSpinner /></div>
  if (error) return <div className="page-root"><ErrorMessage message={error.message} /></div>

  return (
    <div className="page-root">
      <PageHeader
        title="Buyers"
        subtitle={`${buyers.length} registered buyers`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input className="input-sm pl-8 w-44" placeholder="Search buyers…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn-primary btn-sm gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus size={14} />Register Buyer
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b, i) => (
          <div key={b.id} className="card-hover p-5 cursor-pointer group">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-glow-sm`}>
                {b.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-100">{b.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-zinc-600" />
                  <p className="text-xs text-zinc-500">{b.city}</p>
                  {b.type && <span className="badge badge-gray ml-1 !text-[10px]">{b.type}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {b.outstanding > 0 && <span className="badge badge-red">Overdue</span>}
                <span className="font-mono text-2xs text-zinc-700 group-hover:text-zinc-500">{b.id}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs pt-3 border-t border-zinc-800/60">
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5 text-zinc-600"><Phone size={10} />Contact</span>
                <span className="font-mono text-zinc-300">{b.contact}</span>
              </div>
              {b.email && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-600"><Mail size={10} />Login Email</span>
                  <span className="font-mono text-zinc-400 text-[10px]">{b.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-600">Total Orders</span>
                <span className="font-bold text-zinc-200 flex items-center gap-1">
                  <TrendingUp size={10} className="text-emerald-400" />{b.orders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Outstanding</span>
                <span className={b.outstanding > 0 ? 'font-bold text-red-400' : 'text-emerald-400 font-semibold'}>
                  {b.outstanding > 0 ? `₹${b.outstanding.toLocaleString('en-IN')}` : 'Cleared'}
                </span>
              </div>
            </div>

            {/* Portal access indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-2xs text-zinc-700 group-hover:text-zinc-500 transition-colors">
              <ShieldCheck size={11} />
              <span>Portal access & tracking token assigned</span>
            </div>
          </div>
        ))}
      </div>

      <BuyerRegisterModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
        existingCount={buyers.length}
      />
    </div>
  )
}
