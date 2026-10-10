# TextileManagement  # Everest Textile Mills — Manufacturing Management System

> One unified platform to replace notebooks, paper slips, registers and phone calls in a fabric factory.

![status](https://img.shields.io/badge/status-hackathon%20build-orange)
![stack](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20PostgreSQL-blue)

---

## Problem Statement

Everest Textile Mills buys yarn, converts it into fabric through **spinning → weaving → dyeing**, inspects it for defects, and sells finished rolls to many buyers, each with its own fabric type, colour, quantity and deadline.

Today the mill runs on manual processes:

| Area | How it works today | Result |
| --- | --- | --- |
| Raw material stock | Notebook | Unknown real stock, surprise shortages |
| Machine & order status | Walking the floor | Idle machines, delayed orders |
| Quality checks | Paper slips | No traceability of defects |
| Buyer updates | Phone calls | Wasted time, unhappy buyers |
| Attendance & wages | Register | Errors, no cost visibility |

**Nobody knows the real cost of a single roll of fabric.** This project builds the digital backbone that fixes that.

---

## Features (a day at the mill)

| # | Scene | What the system does |
| --- | --- | --- |
| 1 | **Yarn arrives at the gate** | Gate Entry (GRN) records supplier, yarn type, colour, quantity and linked order. Stock updates automatically, low-stock warnings appear, and a new order instantly shows whether yarn is sufficient or a PO is needed. |
| 2 | **Production floor** | Live Machine Board shows which order is on which machine, progress, idle machines, breakdowns and today's output. |
| 3 | **Quality check** | Roll-level inspection (Pass / Rework / Reject) with defect types. Every roll is traceable to its order and machine. |
| 4 | **Buyer calls** | Public, read-only tracking page shows exact order stage and expected date. No phone call needed. |
| 5 | **Dispatch** | Only passed rolls can be dispatched, a roll can never go out twice, and the invoice always matches the dispatch. |
| 6 | **Month-end** | Cost per order and per roll, machine output, wages paid and a monthly P&L dashboard. |

---

## User Roles

| Role | Responsibilities |
| --- | --- |
| **Owner / Admin** | Dashboards, costing, approvals, user management |
| **Store Keeper** | Gate entry, stock, finished goods, dispatch |
| **Production Supervisor** | Machine assignment, production entry, downtime |
| **Quality Inspector** | Inspect rolls, record defects |
| **Office / Accounts** | Buyers, orders, POs, invoices, payments, payroll |
| **Buyer** (external) | Read-only tracking of their own order |

---

## Modules

| Module | Scope |
| --- | --- |
| **A. Auth & Setup** | Role-based login, user and role management |
| **B. Inventory** | Suppliers, yarn catalog, GRN, stock levels, stock ledger, purchase orders |
| **C. Buyers & Orders** | Buyers, orders, yarn availability check, order timeline |
| **D. Production** | Machine board, work assignment, daily production, downtime |
| **E. Quality Control** | Inspection queue, inspection form, defect report |
| **F. Buyer Tracking** | Public order status page |
| **G. Dispatch & Billing** | Finished stock, dispatch, packing list, GST invoice PDF |
| **H. Workers & Wages** | Workers, shift attendance, monthly wage sheet |
| **I. Finance & Reports** | Payments, order costing, machine output, monthly P&L |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express, REST (JSON), Zod validation |
| Database | PostgreSQL with Prisma ORM |
| Auth | JWT with role-based middleware |
| PDF | Server-side invoice PDF generation |
| Testing | Vitest / Jest, Supertest |
| Deployment | Docker, Render / Railway (demo) or AWS EC2 |

---

## Architecture

```
┌──────────────┐     REST/JSON      ┌────────────────────┐      ┌──────────────┐
│  React App   │ ─────────────────► │  Express API       │ ───► │ PostgreSQL   │
│  (role-based │ ◄───────────────── │  routes → service  │ ◄─── │ (Prisma)     │
│   UI)        │                    │  → Prisma          │      └──────────────┘
└──────────────┘                    └────────────────────┘
       ▲                                     │
       │                                     ▼
 Public Buyer Tracking Page          PDF (invoice) · Alerts
```

### Folder structure

```
everest-textile-mills/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── pages/           # one folder per module
│       ├── components/
│       └── lib/             # api client, auth, hooks
├── server/
│   └── src/
│       ├── modules/
│       │   ├── auth/
│       │   ├── inventory/
│       │   ├── orders/
│       │   ├── production/
│       │   ├── quality/
│       │   ├── dispatch/
│       │   ├── hr/
│       │   └── finance/
│       ├── middleware/      # auth, roles, error handler
│       └── app.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docker-compose.yml
└── README.md
```

Each backend module contains `routes`, `controller`, `service` and `tests`.

---

## Data Model

| Group | Tables |
| --- | --- |
| Users | `users`, `roles` |
| Inventory | `suppliers`, `yarn_types`, `yarn_stock_batches`, `gate_entries`, `stock_movements`, `purchase_orders`, `purchase_order_items` |
| Orders | `buyers`, `orders`, `order_items`, `order_status_history` |
| Production | `machines`, `machine_stages`, `work_assignments`, `production_logs`, `downtime_logs` |
| Quality | `fabric_rolls`, `inspections`, `defects` |
| Dispatch | `dispatches`, `dispatch_items`, `invoices`, `invoice_items` |
| HR | `workers`, `shifts`, `attendance`, `wage_records` |
| Finance | `payments`, `expenses` |

**Traceability link (the heart of the system):**

```
fabric_roll ──► order_id
            ──► machine_id
            ──► work_assignment_id
            ──► production_date
```

This single link enables defect root-cause analysis, per-roll costing and buyer tracking.

---

## Status Lifecycles

- **Order:** `Draft → Confirmed → Yarn Pending → In Production → Quality Check → Ready to Ship → Dispatched → Closed`
- **Machine:** `Idle → Running → Breakdown → Idle`
- **Fabric Roll:** `Produced → Awaiting QC → Passed / Rework / Rejected → In Finished Stock → Dispatched`
- **Rework:** rework rolls return to the production queue, then QC again
- **Purchase Order:** `Raised → Partially Received → Received`

---

## Business Rules

- **Yarn required** = order quantity × yarn-per-meter ratio (from the fabric type master). If stock is short, show the shortage and suggest a PO.
- **Stock is never edited directly.** Stock = sum of `stock_movements` (IN / OUT / ADJUST).
- **Gate entry** adds an IN movement automatically; **yarn issue to production** adds an OUT movement and attaches cost to the order.
- **Low-stock alert** when available stock falls below the reorder level.
- **Roll ID is unique** (e.g. `EVR-2026-000123`) and ready for barcode/QR.
- **Only Passed rolls** enter finished stock; rejected rolls are recorded separately.
- **Double dispatch is blocked** by a DB unique constraint plus an API check.
- **Invoice quantity must equal dispatch quantity**; invoices are locked after issue.
- **Buyer status is derived** from order and roll status, never typed manually.
- **One active assignment per machine**; breakdown blocks new assignments.
- **Money is stored as integer paise**, dates as UTC ISO.

### Costing formula

```
Order Cost   = Yarn cost (average rate × qty issued)
             + Dyeing chemicals / other materials
             + Labour (wages allocated by output share)
             + Overhead (power, maintenance, fixed per meter)

Cost per roll = Order Cost ÷ good rolls produced
Profit        = Invoice value − Order Cost
```

---

## API Overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/login`, `GET /auth/me` |
| Inventory | `CRUD /suppliers`, `/yarn-types` · `POST /gate-entries` · `GET /stock` · `GET /stock/ledger` · `CRUD /purchase-orders` · `POST /purchase-orders/:id/receive` |
| Orders | `CRUD /buyers`, `/orders` · `POST /orders/:id/check-yarn` · `POST /orders/:id/confirm` · `PATCH /orders/:id/status` |
| Production | `GET /machines` · `PATCH /machines/:id/status` · `POST /assignments` · `POST /production-logs` · `POST /downtime` |
| Quality | `GET /rolls?status=awaiting_qc` · `POST /inspections` · `GET /reports/defects` |
| Dispatch | `GET /finished-stock` · `POST /dispatches` · `GET /invoices/:id` · `GET /invoices/:id/pdf` |
| Buyer portal | `GET /track/:orderNo?token=…` (public, read-only) |
| HR / Finance | `CRUD /workers` · `POST /attendance` · `POST /payroll/generate` · `POST /payments` · `GET /reports/order-costing` · `GET /reports/machine-output` · `GET /reports/monthly-pnl` |

All responses use the shape `{ data, error }`.

---

## Roles & Permissions

| Module | Owner | Store | Supervisor | Inspector | Accounts | Buyer |
| --- | --- | --- | --- | --- | --- | --- |
| Inventory | View | Full | View | – | View | – |
| Orders | Full | View | View | View | Full | Own order |
| Production | View | – | Full | View | – | – |
| Quality | View | – | View | Full | – | – |
| Dispatch / Invoice | View | Full | – | – | Full | Own order |
| Wages / Finance | Full | – | – | – | Full | – |
| User management | Full | – | – | – | – | – |

---

## Alerts

- Low yarn stock
- Order deadline close or missed
- Machine breakdown or long idle time
- Rolls waiting for QC longer than X hours
- Buyer payment overdue

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm or pnpm

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/everest-textile-mills.git
cd everest-textile-mills

cd server && npm install
cd ../client && npm install
```

### 2. Environment variables

Create `server/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/everest"
JWT_SECRET="change-me"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

Create `client/.env`:

```env
VITE_API_URL="http://localhost:4000"
```

### 3. Database

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### 4. Run

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

Open **http://localhost:5173**.

### Run with Docker

```bash
docker compose up --build
```

### Demo logins (from seed data)

| Role | Email | Password |
| --- | --- | --- |
| Owner | owner@everest.test | `password123` |
| Store Keeper | store@everest.test | `password123` |
| Supervisor | supervisor@everest.test | `password123` |
| Inspector | qc@everest.test | `password123` |
| Accounts | accounts@everest.test | `password123` |

> Demo credentials are for local development only.

---

## Demo Walkthrough ("One Day at the Mill")

1. **Store Keeper** records a yarn truck via Gate Entry → stock increases, ledger shows IN.
2. **Accounts** creates a new order → yarn availability check shows enough stock (or a shortage and a PO suggestion).
3. **Supervisor** assigns the order to a weaving machine → Machine Board shows it running.
4. **Supervisor** logs production → rolls are created with unique IDs.
5. **Inspector** inspects rolls → pass, rework and reject outcomes recorded.
6. **Buyer** opens the tracking link → sees the live stage and expected date.
7. **Store Keeper** creates a dispatch with passed rolls → double dispatch is blocked.
8. **Accounts** issues the invoice PDF and records the payment.
9. **Owner** opens the dashboard → cost per order, machine output, wages and monthly profit.

---

## Testing

```bash
cd server && npm test
```

Core business rules covered by tests: stock ledger integrity, yarn availability check, double-dispatch prevention, invoice/dispatch quantity match, and order status transitions.

---

## Roadmap

| Phase | Scope | Outcome |
| --- | --- | --- |
| 1 | Foundation + Inventory | Yarn gate to stock |
| 2 | Orders + availability check | Orders with shortage detection |
| 3 | Production + Machine Board | Live floor view |
| 4 | Quality + roll traceability | Pass / rework / reject records |
| 5 | Dispatch + Invoice + Buyer tracking | Buyer self-service, invoice PDF |
| 6 | Wages + Costing + Owner Dashboard | Month-end profit view |
| 7 | Polish | Alerts, seed data, demo video |

**Future ideas:** QR/barcode scanning for rolls, WhatsApp/SMS buyer updates, order delay prediction, AI-generated daily summary for the owner, defect-pattern analysis, Android app for floor staff.

---

## Team

| Name | Role |
| --- | --- |
| _Your Name_ | _Full-stack_ |
| _Teammate_ | _..._ |

---

## License

MIT — built for a hackathon.
