# Implementation Plan — Separate Home Landing Page and Header-Based Sign In

## Project Context

- **Stack:** React 19 + Vite + Tailwind CSS 3 + React Router v6 + Lucide React
- **Auth:** Demo-only (`AuthContext.jsx`). `login(email, password)` returns `{ ok, role, error }`. No `@hookform/resolvers` — use `react-hook-form` `register()` with inline validation rules.
- **Design tokens:** dark zinc base (`bg-zinc-950`), primary indigo (`primary-500/600`), component classes `.card`, `.card-glass`, `.btn-primary`, `.btn-secondary`, `.input`, `.label`, `.icon-btn` from `index.css`.
- **Build:** `cd client && npm run build` — must pass with zero errors.
- **Lint:** `cd client && npm run lint` — must pass with zero new warnings/errors.

---

## File Map

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `client/src/components/layout/PublicHeader.jsx` |
| 2 | CREATE | `client/src/features/home/HomePage.jsx` |
| 3 | CREATE | `client/src/features/auth/SignInPage.jsx` |
| 4 | MODIFY | `client/src/App.jsx` |

---

## Plan

- [ ] 1. Create `PublicHeader.jsx` — the responsive header for public pages only.

  **What to do:** Build a sticky header component that renders the Everest Textile Mills logo (Layers icon from lucide-react), nav links (Home, About, Features, Contact as anchor-scroll links using `href="#about"` etc.), and a Sign In button on the right that navigates to `/signin` via `useNavigate`. Include a hamburger menu for mobile (toggle inline state). The header must NOT appear inside `AppLayout` — it is only composed into public page components.

  **Imports needed:**
  ```jsx
  import { useState } from 'react'
  import { useNavigate, Link } from 'react-router-dom'
  import { Layers, Menu, X } from 'lucide-react'
  import { cn } from '../../lib/utils'
  ```

  **Key structure:**
  - `<header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800/60">` 
  - Desktop: flex row, logo left, nav links center, Sign In button right
  - Mobile: hamburger toggles a vertical dropdown nav (`<nav>` with `flex-col` links + Sign In)
  - Sign In button: `<button onClick={() => navigate('/signin')} className="btn-primary btn-sm">`
  - Nav links: `<a href="#features">`, `<a href="#about">` etc. — plain anchor scrolling, not Router `<Link>` (they point to same-page sections on HomePage only)
  - Logo area: identical markup to `LoginPage.jsx` logo block (Layers icon in `from-primary-500 to-violet-600` gradient div + company name)

  **Files:** `client/src/components/layout/PublicHeader.jsx`

  **Verify:** `cd client && npm run build` completes without errors.

---

- [ ] 2. Create `HomePage.jsx` — the public landing page at `/`.

  **What to do:** Build a full-page landing component that composes `PublicHeader` at the top and includes all required sections (Hero, Features, How It Works, About, Footer). Uses only Tailwind utility classes and the existing design tokens from `index.css`. No new CSS files. Smooth-scroll `id` anchors on each section so header links work.

  **Imports needed:**
  ```jsx
  import { useNavigate } from 'react-router-dom'
  import { Layers, Package, Cpu, Search, Truck, Users, BarChart2, ArrowRight, ChevronDown } from 'lucide-react'
  import PublicHeader from '../../components/layout/PublicHeader'
  import { cn } from '../../lib/utils'
  ```

  **Sections to build:**

  ### Hero (`id="hero"`)
  - Full-viewport (`min-h-screen`) dark section, `bg-zinc-950` + subtle `bg-grid` overlay + two blurred orbs (same pattern as `LoginPage` hero panel — copy the `absolute` gradient blob divs).
  - Heading: `"Smart Manufacturing. Complete Traceability."` — `text-5xl font-bold` with `.text-gradient-primary` on last word/phrase.
  - Sub-text: one paragraph describing the platform (yarn to dispatch, quality, workforce).
  - Primary CTA: `<button onClick={() => navigate('/signin')} className="btn-primary btn-lg">Get Started <ArrowRight /></button>`
  - Secondary CTA: `<a href="#features" className="btn-secondary btn-lg">Explore Features <ChevronDown /></a>`

  ### Features (`id="features"`)
  - Section heading, then a responsive CSS grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
  - 7 feature cards using `.card-hover p-6` with a Lucide icon, bold title, short description:
    1. Smart Inventory Management — `Package`
    2. Production & Order Tracking — `Cpu`
    3. Fabric Roll Traceability — `Layers`
    4. Quality Control & Inspection — `Search`
    5. Dispatch & Billing — `Truck`
    6. Workforce Management — `Users`
    7. Financial Reports & Analytics — `BarChart2`

  ### How It Works
  - Horizontal steps (flex row on md+, flex col on mobile) with arrow connectors:
    `Order Creation → Production → Quality Inspection → Finished Stock → Dispatch`
  - Each step: rounded pill/card with step number + label. Arrows: `→` text between them, hidden on mobile or replaced by `↓`.

  ### About (`id="about"`)
  - Two-column layout on lg+: left text, right a `.card-glass` block.
  - Text explains replacing disconnected registers with a centralized system. Mention Everest Textile Mills by name.

  ### Footer
  - `bg-zinc-900 border-t border-zinc-800` footer with project name + description on the left, nav links on the right (Home, Features, About, Contact, Sign In → `/signin`).
  - Copyright line at bottom.

  **Responsive requirements:** All sections use `px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto` container pattern.

  **Files:** `client/src/features/home/HomePage.jsx`  
  *(create the `home/` subdirectory — it does not exist yet)*

  **Verify:** `cd client && npm run build` completes. Open `http://localhost:5173/` and confirm the landing page renders (after running `npm run dev`).

---

- [ ] 3. Create `SignInPage.jsx` — the dedicated sign-in page at `/signin`.

  **What to do:** Build a standalone sign-in page (no `AppLayout`, no `PublicHeader` — just a full-page centered card). Connect to `AuthContext.login()` for demo auth. Use `react-hook-form` `register()` with inline validation rules (no `zodResolver` — package not installed).

  **Imports needed:**
  ```jsx
  import { useState } from 'react'
  import { useForm } from 'react-hook-form'
  import { useNavigate, Link } from 'react-router-dom'
  import { useAuth } from '../../context/AuthContext'
  import { ROLE_HOME } from '../../context/AuthContext'
  import { Eye, EyeOff, Loader2, ArrowRight, Layers } from 'lucide-react'
  import { cn } from '../../lib/utils'
  ```

  **Layout:** Two-panel like `LoginPage` (left hero panel hidden on mobile, right form panel). Reuse the same left-panel markup from `LoginPage.jsx` verbatim (gradient background, bg-grid, logo, heading, feature mini-cards). This keeps visual consistency — the existing `LoginPage` at `/login` is untouched and still works.

  **Form fields (3 required):**

  ### Email Address
  ```jsx
  <label className="label">Email Address</label>
  <input
    type="email"
    placeholder="Enter your email address"
    className={cn('input', errors.email && 'border-red-500')}
    {...register('email', {
      required: 'Email is required',
      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
    })}
  />
  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
  ```

  ### Password
  ```jsx
  <label className="label">Password</label>
  <div className="relative">
    <input
      type={showPw ? 'text' : 'password'}
      placeholder="Enter your password"
      className={cn('input pr-11', errors.password && 'border-red-500')}
      {...register('password', { required: 'Password is required' })}
    />
    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn !w-7 !h-7 !border-0 !bg-transparent">
      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  </div>
  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
  ```

  ### Role Selection (dropdown — not buttons)
  ```jsx
  <label className="label">Select Your Role</label>
  <select
    className={cn('input', errors.role && 'border-red-500')}
    {...register('role', { required: 'Please select your role' })}
    defaultValue=""
  >
    <option value="" disabled>Select your role</option>
    <option value="owner">Owner / Admin</option>
    <option value="store">Store Keeper</option>
    <option value="supervisor">Production Supervisor</option>
    <option value="inspector">Quality Inspector</option>
    <option value="accounts">Office / Accounts</option>
    <option value="buyer">Buyer</option>
  </select>
  {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role.message}</p>}
  ```
  > Note: `buyer` has no `ROLE_HOME` entry. After successful login with role `buyer`, redirect to `/dashboard` as fallback.

  **`handleSubmit` logic:**
  ```js
  const onSubmit = async ({ email, password, role }) => {
    setAuthError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))   // simulate async
    const res = login(email, password)
    setLoading(false)
    if (res.ok) {
      // Validate that the authenticated role matches the selected role
      if (res.role !== role) {
        setAuthError('Role does not match this account. Please select the correct role.')
        return
      }
      navigate(ROLE_HOME[res.role] || '/dashboard')
    } else {
      setAuthError(res.error)
    }
  }
  ```

  **Additional UI:**
  - `authError` state (string) displayed in red error box (same pattern as `LoginPage.jsx` error div).
  - `loading` state disables submit button and shows `<Loader2 className="animate-spin" />`.
  - "Back to Home" link: `<Link to="/" className="btn-ghost btn-sm">← Back to Home</Link>` below the form or in the header area.
  - No registration link (not in existing project).

  **Files:** `client/src/features/auth/SignInPage.jsx`

  **Verify:** `cd client && npm run build` passes. Navigate to `/signin`, confirm all three fields render, confirm validation fires on empty submit, confirm role dropdown has 6 options.

---

- [ ] 4. Modify `App.jsx` — add public routes without breaking existing ones.

  **What to do:** Add two new imports and two new `<Route>` elements. The `RootRedirect` component stays exactly as-is — it already handles unauthenticated redirect to `/login`. The new `/` route must be declared **before** the existing `<Route path="/" element={<RootRedirect />} />` line so React Router matches it first for unauthenticated visitors, OR replace the existing `/` route entry with a smarter `HomeOrRedirect` component that shows `HomePage` when unauthenticated and redirects authenticated users to their role home. The latter is cleaner and avoids route-order confusion.

  **Routing change — replace `RootRedirect` usage at `/`:**

  Change `RootRedirect` to handle all three cases:
  ```jsx
  function RootRedirect() {
    const { user } = useAuth()
    if (!user) return <HomePage />          // unauthenticated → show landing page
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />
  }
  ```
  > This keeps the single `<Route path="/" element={<RootRedirect />} />` declaration, no route-order risk.
  >
  > `HomePage` is imported at the top: `import HomePage from './features/home/HomePage'`

  **Add `/signin` route** in the public block (alongside `/login`, `/track`):
  ```jsx
  <Route path="/signin" element={<SignInPage />} />
  ```
  Import at top: `import SignInPage from './features/auth/SignInPage'`

  **Full diff summary for `App.jsx`:**
  1. Add `import HomePage from './features/home/HomePage'`
  2. Add `import SignInPage from './features/auth/SignInPage'`
  3. In `RootRedirect`: change `if (!user) return <Navigate to="/login" replace />` → `if (!user) return <HomePage />`
  4. Add `<Route path="/signin" element={<SignInPage />} />` in the public routes block.
  5. All other routes — unchanged.

  **Files:** `client/src/App.jsx`

  **Verify:** 
  ```
  cd client && npm run build
  cd client && npm run lint
  ```
  Both must exit with code 0 and no new errors. Then `npm run dev`:
  - `/` shows the landing page for an unauthenticated visitor
  - Authenticated users visiting `/` are redirected to their role home (existing behavior preserved)
  - `/signin` renders the new sign-in form
  - `/login` still works (existing ERP login untouched)
  - All protected ERP routes still work after login

---

## Authentication Backend Note

The current auth is **DEMO-ONLY**. `AuthContext.jsx` checks credentials against a hardcoded `DEMO_USERS` array in the browser — there is no backend API. The sign-in form connects to `login()` from `AuthContext` which is sufficient for demo use.

**Backend work remaining before production:**
- Create a real `/api/auth/login` endpoint that accepts `{ email, password, role }` and verifies credentials + role assignment server-side.
- Replace the `login()` function in `AuthContext.jsx` with an `axios.post` call to that endpoint.
- The backend must return a session token (JWT or cookie) and confirm the user's actual assigned role — client-side role selection must never be treated as authorization proof.
- The `buyer` role does not currently exist in `DEMO_USERS` or `ROLE_HOME`. A buyer user account and protected route must be created when real auth is added.

---

## Verification Checklist (run after all 4 items complete)

```bash
cd c:\Users\srush\odootextile\TextileManagement\client
npm run build     # must exit 0, zero errors
npm run lint      # must exit 0, no new errors
```

Manual checks after `npm run dev`:
1. `http://localhost:5173/` — landing page loads, not login redirect
2. Header visible: logo, nav links, Sign In button
3. Sign In button → navigates to `/signin`
4. `/signin` form has Email, Password, Role dropdown (6 options including Buyer)
5. Empty submit → validation messages on all fields
6. Invalid email format → email validation error
7. Bad credentials → "Invalid email or password" error message
8. `owner@everest.com` + `demo123` + Owner/Admin → redirects to `/dashboard`
9. `http://localhost:5173/login` — existing ERP login still renders
10. After ERP login, all dashboard/ERP routes remain accessible
