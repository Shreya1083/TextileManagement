/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary indigo-violet accent
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Dark surface system
        zinc: {
          925: '#141418',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px -2px rgba(99,102,241,0.4)',
        'glow':     '0 0 24px -4px rgba(99,102,241,0.5)',
        'glow-lg':  '0 0 40px -8px rgba(99,102,241,0.6)',
        'card':     '0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.3)',
        'elevated': '0 8px 32px rgba(0,0,0,0.5)',
        'modal':    '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        'grid-dark': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':      'fadeIn 0.25s ease-out both',
        'slide-up':     'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-right':  'slideRight 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:    { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
