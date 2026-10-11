import { useNavigate, Link } from 'react-router-dom'
import {
  Package, Factory, QrCode, ClipboardCheck, Truck,
  Users, BarChart3, ChevronRight, Layers, ArrowRight,
  Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Facebook,
} from 'lucide-react'
import PublicHeader from '../../components/layout/PublicHeader'
import heroImg from '../../assets/hero.png'

const FEATURES = [
  {
    icon: Package,
    title: 'Smart Inventory Management',
    desc: 'Track raw materials, yarn lots, and consumables from gate to floor.',
  },
  {
    icon: Factory,
    title: 'Production & Order Tracking',
    desc: 'Monitor every machine and order in real time.',
  },
  {
    icon: QrCode,
    title: 'Fabric Roll Traceability',
    desc: 'Full traceability from yarn to finished roll with QR scan.',
  },
  {
    icon: ClipboardCheck,
    title: 'Quality Control & Inspection',
    desc: 'Defect logging, roll inspection queues, and analytics.',
  },
  {
    icon: Truck,
    title: 'Dispatch & Billing',
    desc: 'Finished stock management, dispatch notes, and invoices.',
  },
  {
    icon: Users,
    title: 'Workforce Management',
    desc: 'Worker profiles, attendance, and wage calculation.',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports & Analytics',
    desc: 'P&L, costing, and revenue dashboards for administrators.',
  },
]

const HOW_IT_WORKS = [
  'Order Creation',
  'Production',
  'Quality Inspection',
  'Finished Stock',
  'Dispatch',
]

const STATS = [
  { value: '12,400+', label: 'Rolls tracked' },
  { value: '94.2%',   label: 'Machine uptime' },
  { value: '₹18.4L',  label: 'Sep revenue' },
  { value: '5',       label: 'Role-based access levels' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <main>
        {/* ── Hero ── */}
        <section
          id="hero"
          className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 bg-grid pointer-events-none" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: text + CTAs */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/15 border border-primary-500/25 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                  <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">
                    Smart Manufacturing ERP
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold text-zinc-50 leading-[1.1] tracking-tight mb-6">
                  Smart Manufacturing.{' '}
                  <br className="hidden sm:block" />
                  <span className="text-gradient-primary">Complete Traceability.</span>
                </h1>

                <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-8">
                  From raw yarn at the gate to invoiced dispatch — Everest Textile Mills&apos; platform
                  manages production, inventory, quality inspection, workforce, and financials in one place.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => navigate('/signin')}
                    className="btn-primary btn-lg"
                  >
                    Get Started <ArrowRight size={18} />
                  </button>
                  <a href="#features" className="btn-secondary btn-lg">
                    Explore Features <ChevronRight size={18} />
                  </a>
                </div>
              </div>

              {/* Right: hero image */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="relative w-full max-w-lg">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-violet-600/10 rounded-3xl blur-xl" />
                  <img
                    src={heroImg}
                    alt="Everest Textile Mills ERP platform interface"
                    className="relative rounded-2xl border border-zinc-800/60 shadow-elevated w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 bg-zinc-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-50 tracking-tight mb-3">
                Everything your mill needs
              </h2>
              <p className="text-zinc-400 text-lg">Seven modules. One platform.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card-hover p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-400 mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 mb-2 leading-snug">{title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-zinc-50 tracking-tight mb-3">
                How It Works
              </h2>
              <p className="text-zinc-400">From order to dispatch in one connected system.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={step} className="flex items-center gap-3 md:gap-0">
                  {/* Step card */}
                  <div className="flex flex-col items-center gap-2.5 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl px-5 py-4 min-w-[130px] text-center">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 leading-snug">{step}</span>
                  </div>

                  {/* Arrow connector (hidden after last step) */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <>
                      <ChevronRight size={18} className="hidden md:block text-zinc-600 mx-2 shrink-0" />
                      <div className="md:hidden w-px h-4 bg-zinc-700 mx-auto" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section id="about" className="py-24 bg-zinc-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left: text */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-50 tracking-tight mb-5">
                  Built for Indian Textile Mills
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed mb-4">
                  Everest Textile Mills ERP replaces disconnected registers and manual tracking with
                  a centralized digital system. Every yarn lot, machine assignment, quality check,
                  and dispatch is recorded, traceable, and reportable.
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Whether you run a single-floor weaving unit or a multi-department composite mill,
                  the platform scales with your operations — giving administrators real-time visibility and
                  giving floor staff the tools they need to do their jobs faster.
                </p>

                <div className="mt-8">
                  <button
                    onClick={() => navigate('/signin')}
                    className="btn-primary"
                  >
                    Start Using the Platform <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* Right: stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {STATS.map(({ value, label }) => (
                  <div key={label} className="card p-6">
                    <p className="text-2xl font-bold text-zinc-50 tracking-tight mb-1">{value}</p>
                    <p className="text-xs text-zinc-500 leading-snug">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer / Contact ── */}
        <footer id="contact" className="bg-zinc-900 border-t border-zinc-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-9 h-9 shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600" />
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                      <Layers size={18} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-50">Everest Textile Mills</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ERP Platform</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Smart Manufacturing ERP for textile mills — from gate entry to dispatch, all in one platform.
                </p>
              </div>

              {/* Contact Info */}
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Contact Info</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <Mail size={14} className="text-primary-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Email</p>
                      <a href="mailto:info@everesttextile.com" className="text-sm text-zinc-300 hover:text-primary-400 transition-colors">
                        info@everesttextile.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone size={14} className="text-primary-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Phone</p>
                      <a href="tel:+919876543210" className="text-sm text-zinc-300 hover:text-primary-400 transition-colors">
                        +91 98765 43210
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-primary-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 mb-0.5">Address</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Plot No. 42, Industrial Area,<br />Surat, Gujarat 395010, India
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Nav links */}
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Platform</p>
                <nav className="space-y-2.5">
                  <Link to="/" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Home</Link>
                  <a href="#features" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Features</a>
                  <a href="#about" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">About</a>
                  <Link to="/signin" className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Sign In</Link>
                </nav>
              </div>

              {/* Social Media */}
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Follow Us</p>
                <div className="flex items-center gap-3 mb-4">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200"
                    aria-label="Twitter"
                  >
                    <Twitter size={16} />
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200"
                    aria-label="Instagram"
                  >
                    <Instagram size={16} />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 hover:text-primary-400 hover:border-primary-500/40 hover:bg-primary-500/10 transition-all duration-200"
                    aria-label="Facebook"
                  >
                    <Facebook size={16} />
                  </a>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Stay connected for updates, industry insights, and product announcements.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-zinc-600">© 2024 Everest Textile Mills. Smart Manufacturing ERP.</p>
              <p className="text-xs text-zinc-700">All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
