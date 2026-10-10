# Public Landing Page and Header-Based Sign In — Frontend Separation

Three new public-facing files (`PublicHeader.jsx`, `HomePage.jsx`, `SignInPage.jsx`) separate the landing experience from the internal ERP dashboard. `App.jsx` routes unauthenticated visitors to the landing page at `/` and authenticated users directly to their role home. All existing protected routes and the legacy `LoginPage` are untouched.

**Watch for:** The `AuthContext` client-side demo credential array (`DEMO_USERS`) is reachable from `SignInPage` at build time and is bundled into production unless the demo hint block and the `DEMO_USERS` export are removed before production deployment. The demo hint is correctly gated behind `import.meta.env.DEV`, but the credential data itself is not — it lives in the shared `AuthContext` module which ships in all builds. [confirmed]

**Verdict**: APPROVED

---

## High-level view

All three required files exist at the correct paths and are properly wired into `App.jsx`. The `RootRedirect` component cleanly bifurcates the root route: unauthenticated users see `HomePage`, authenticated users are redirected to their role home. No `AppLayout` wraps the public pages, so the internal sidebar and topbar do not leak into the public surface.

The `PublicHeader` is a standalone component used only by `HomePage`. It carries all four required nav links (Home, About, Features, Contact) and a Sign In button that navigates to `/signin`. The Contact link targets the footer's `id="contact"` anchor on the landing page, which is a reasonable UX choice for a single-page public section; it will silently no-op when the header is rendered outside that page, but since `PublicHeader` is only used on `HomePage`, this is not a functional problem.

`SignInPage` collects email, password, and role as independent inputs, which is the correct pattern — the user must know and enter their own credentials rather than picking from a pre-populated list. The role cross-check after `login()` returns prevents a credential from one user authenticating as a different role. The demo credentials hint is gated behind `import.meta.env.DEV` at the UI level, but `DEMO_USERS` (including plaintext demo passwords) is exported from `AuthContext` and will be bundled in production until that module is replaced with a real API call. The `TODO` comment in `AuthContext` documents this, and the review requirement explicitly acknowledges the backend work is outstanding — this is a known, documented gap rather than an oversight.

`HomePage` covers all five required sections (Hero, Features, How It Works, About, Footer) with all seven feature cards. The hero image is loaded from `../../assets/hero.png`, which exists in the asset tree. The `STATS` block in the About section uses hardcoded demo values (`12,400+ Rolls tracked`, `94.2% Machine uptime`, `₹18.4L Sep revenue`) — these should be reviewed before public exposure, though they appear intentional for a demo/pilot deployment.

---

<details>
<summary>Issues (2)</summary>

1. **DEMO_USERS bundled in production** — `AuthContext.jsx` exports `DEMO_USERS` with plaintext demo passwords. This module is imported by `LoginPage`, `SignInPage`, and `App.jsx`, so those credentials ship in every production bundle until the module is replaced with a real API. The `TODO` comment documents this, but the risk should be explicitly tracked. Severity: MEDIUM. Action: remove `DEMO_USERS` and the client-side `login()` implementation before any production deployment.

2. **Hardcoded stats in public About section** — `HomePage.jsx` STATS array and `SignInPage.jsx` bottom stats both display specific revenue/machine-uptime figures (`₹18.4L Sep revenue`, `94.2%`) as if they are live data. If this page is shown to external buyers or prospective customers, these values need to either be real or clearly marked as demo. Severity: LOW. Action: replace with live data from the API, or label them as sample/demo values before public exposure.

</details>

---

<details>
<summary>Details</summary>

## Focus area results

### 1. All three new files exist — PASS

- `PublicHeader.jsx` → `client/src/components/layout/PublicHeader.jsx` ✓
- `HomePage.jsx` → `client/src/features/home/HomePage.jsx` ✓
- `SignInPage.jsx` → `client/src/features/auth/SignInPage.jsx` ✓

### 2. App.jsx routing — PASS

`RootRedirect` at `/` renders `<HomePage />` when `user` is null, and `<Navigate to={ROLE_HOME[user.role]}>` when authenticated. `/signin` maps to `<SignInPage />`. All 30+ original ERP routes are present and unchanged inside the `<ProtectedRoute>` / `<AppLayout>` tree. The `ProtectedRoute` redirects unauthenticated users to `/signin`, not `/login`, which is consistent with the new sign-in flow.

### 3. SignInPage form fields — PASS

- **Email**: `type="email"`, placeholder matches spec, `required` + pattern regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, error message displayed inline. [confirmed]
- **Password**: `type={showPw ? 'text' : 'password'}`, `required`, `minLength: 3`, show/hide toggle with accessible `aria-label`. [confirmed]
- **Role dropdown**: `<select>` with a disabled placeholder option (`value=""`) and exactly 6 `<option>` elements: `owner`, `store`, `supervisor`, `inspector`, `accounts`, `buyer` — mapping to "Owner / Admin", "Store Keeper", "Production Supervisor", "Quality Inspector", "Office / Accounts", "Buyer". [confirmed]

The `minLength: 3` threshold is deliberately low (demo passwords are `demo123`). This is fine for a dev/demo deployment but should be raised to ≥8 characters before connecting to a real backend.

### 4. PublicHeader nav links and Sign In button — PASS

`NAV_ANCHORS` contains `About (#about)`, `Features (#features)`, `Contact (#contact)`. `Home` is a `<Link to="/">` rendered separately. Desktop and mobile menus both include all four links. The Sign In button calls `navigate('/signin')` on desktop and both navigates and closes the mobile menu on mobile. All interactive elements have accessible labels; the hamburger button carries `aria-label`. [confirmed]

### 5. HomePage sections — PASS

All five sections present with correct `id` anchors:
- `id="hero"` — heading "Smart Manufacturing. Complete Traceability." present, Get Started → `/signin`, Explore Features → `#features`. [confirmed]
- `id="features"` — 7 cards rendered from `FEATURES` array (Package, Factory, QrCode, ClipboardCheck, Truck, Users, BarChart3). [confirmed]
- How It Works — no `id` attribute on the section element, but the 5-step flow (Order Creation → Production → Quality Inspection → Finished Stock → Dispatch) is fully present. The missing `id` means the Contact anchor in the footer cannot deep-link to this section, but this section has no anchor link pointing to it so there is no broken link. [confirmed]
- `id="about"` — present with copy matching the brief. [confirmed]
- `id="contact"` on `<footer>` — present. [confirmed]

### 6. No @hookform/resolvers import — PASS

Grep across all `.jsx` files returns zero matches for `@hookform/resolvers`. `SignInPage` uses `useForm` from `react-hook-form` directly with inline validation rules only. `react-hook-form` is listed in `client/package.json` at `^7.89.0`. [confirmed]

### 7. LoginPage.jsx unchanged — PASS

`LoginPage.jsx` contains the original role-picker UI pattern (pre-populated email from `DEMO_USERS`, custom role dropdown with avatar chips) and no references to new components. It is reachable at `/login` and is preserved as a legacy route in `App.jsx`. [confirmed]

### 8. No AppLayout inside public pages — PASS

`AppLayout` appears in `App.jsx` only inside the `<ProtectedRoute>` wrapper, never inside `RootRedirect`, `HomePage`, or `SignInPage`. Grep for `AppLayout` in `.jsx` files confirms it is imported only in `App.jsx` and defined in `AppLayout.jsx`. [confirmed]

### 9. No plaintext passwords in new files — PASS

`SignInPage.jsx` contains no password literals. The demo credentials hint block visible in the JSX is gated behind `import.meta.env.DEV` and only displays the password as a UI hint (the string `demo123` appears in JSX text, not as an auth value). `PublicHeader.jsx` and `HomePage.jsx` contain no credential data. [confirmed]

The plaintext password exposure risk is in `AuthContext.jsx` (the `DEMO_USERS` array), which is a pre-existing structure. The new `SignInPage` does not introduce new credential hardcoding — it calls `login()` and lets `AuthContext` do the matching.

### 10. All imports resolve — PASS

- `PublicHeader` is imported in `HomePage` via relative path `../../components/layout/PublicHeader` — path matches file location. [confirmed]
- `hero.png` exists at `client/src/assets/hero.png`. [confirmed]
- `react-hook-form` is in `package.json` dependencies. [confirmed]
- `useAuth`, `ROLE_HOME` are both exported from `AuthContext.jsx` and imported correctly in `SignInPage`. [confirmed]
- All Lucide icons used (`Package`, `Factory`, `QrCode`, `ClipboardCheck`, `Truck`, `Users`, `BarChart3`, `ChevronRight`, `Layers`, `ArrowRight`, `Eye`, `EyeOff`, `Loader2`) are standard Lucide React exports. [confirmed]
- `cn` imported from `../../lib/utils` in `SignInPage` — same path used in `LoginPage` and other existing files, so the module exists. [confirmed]

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `client/src/components/layout/PublicHeader.jsx` | New — sticky responsive header with nav links and Sign In button |
| `client/src/features/home/HomePage.jsx` | New — full public landing page with Hero, Features, How It Works, About, Footer sections |
| `client/src/features/auth/SignInPage.jsx` | New — sign-in form with email, password (show/hide), role dropdown, react-hook-form validation |
| `client/src/App.jsx` | Modified — added `RootRedirect`, `/signin` route, imports for three new files |

Pre-existing files read for context (not changed): `AuthContext.jsx`, `LoginPage.jsx`, `ProtectedRoute.jsx`, `AppLayout.jsx`

</details>
