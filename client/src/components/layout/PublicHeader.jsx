import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Layers, Menu, X } from 'lucide-react'

// Anchor-style links scroll to sections on the landing page; Home navigates to /
const NAV_ANCHORS = [
  { label: 'About',    href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Contact',  href: '#contact' },
]

export default function PublicHeader() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 rounded-xl">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 shadow-glow" />
              <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                <Layers size={18} className="text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-zinc-50 leading-tight">Everest Textile Mills</p>
              <p className="text-[10px] text-zinc-500 leading-tight uppercase tracking-widest">ERP Platform</p>
            </div>
            <p className="sm:hidden text-sm font-bold text-zinc-50">Everest Textile</p>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Home uses Link so it navigates to / from any route */}
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-150"
            >
              Home
            </Link>
            {NAV_ANCHORS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-150"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Right: Sign In + mobile hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/signin')}
              className="btn-primary btn-sm hidden sm:inline-flex"
            >
              Sign In
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden icon-btn"
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-zinc-800/60 pb-4 pt-3 space-y-1 animate-fade-in">
            {/* Home uses Link so it navigates to / from any route */}
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-150"
            >
              Home
            </Link>
            {NAV_ANCHORS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-150"
              >
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-zinc-800/60 mt-2">
              <button
                onClick={() => { navigate('/signin'); setMobileOpen(false) }}
                className="btn-primary btn-sm w-full justify-center"
              >
                Sign In
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
