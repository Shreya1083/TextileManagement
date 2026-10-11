# Everest Textile Mills ERP

A web application that runs a textile mill from one place: **yarn in, fabric out, money tracked**.

It replaces notebooks, paper inspection slips, phone calls and attendance registers with one connected system.

---

## The Problem

Everest Textile Mills used to manage everything by hand:

| Before | Problem |
|---|---|
| Yarn stock in a notebook | Material runs out unexpectedly |
| Walking the floor to check machines | Idle machines, late orders |
| Paper quality slips | Defects are hard to trace |
| Phone calls to buyers | No clear order status |
| Attendance register | Wage errors |

## The Solution

One system where every step is recorded, linked and visible, from the day yarn arrives until the invoice is paid.

```mermaid
flowchart LR
    A([Yarn arrives]) --> B[Stock]
    B --> C[Buyer order]
    C --> D[Production]
    D --> E[Quality check]
    E --> F[Dispatch]
    F --> G[Invoice]
    G --> H([Profit report])

    classDef start fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef done fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    class A start
    class H done
```

---

## Features

| Module | What it does |
|---|---|
| **Inventory** | Suppliers, gate entry (goods receipt), live stock levels, low-stock alerts, purchase orders |
| **Orders** | Buyer management, create and track orders, yarn availability check |
| **Production** | Machine board, daily production entry, downtime and breakdown log |
| **Quality** | Inspection queue, Pass / Rework / Reject decisions, defect report |
| **Dispatch** | Finished-goods stock, dispatch creation, invoices |
| **HR** | Workers, attendance, wage sheet, worker dashboards |
| **Finance** | Order costing, monthly profit and loss |
| **Dashboards** | Owner dashboard, floor dashboard, end-of-day (EOD) report |
| **Order Tracking** | Public page where a buyer checks order status with the order number |
| **Settings** | Mill details, master data, user management, notifications |
| **Exports** | Download reports as PDF or Excel |
| **QR codes** | QR labels for fabric rolls |

---

## Main Workflow

```mermaid
flowchart TD
    subgraph STORE["1. Inventory"]
        A([Supplier]) --> B[Gate Entry]
        B --> C[Stock Updated]
    end

    subgraph ORD["2. Orders"]
        D[Buyer Places Order] --> E{Enough yarn?}
        E -- No --> F[Raise Purchase Order]
        F --> C
    end

    subgraph PROD["3. Production"]
        G[Assign Machine] --> H[Daily Production Entry]
        H --> I[Fabric Rolls Created<br/>with QR code]
    end

    subgraph QC["4. Quality Control"]
        J{Inspector Checks Roll}
        K[Rework]
        L[Rejected]
        J -- Rework --> K
        K --> J
        J -- Reject --> L
    end

    subgraph SHIP["5. Dispatch and Billing"]
        M[Finished Stock] --> N[Dispatch to Buyer]
        N --> O[Invoice]
    end

    subgraph MONEY["6. Finance"]
        P[Payments and Costing] --> Q([Profit and Loss Report])
    end

    C --> D
    E -- Yes --> G
    I --> J
    J -- Pass --> M
    O --> P

    classDef start fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef bad fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef done fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    class A start
    class E,J decision
    class L bad
    class Q done
```

### Workers and wages (runs alongside)

```mermaid
flowchart LR
    A([Worker]) --> B[Attendance marked]
    B --> C{Supervisor review}
    C -- Correction needed --> B
    C -- Approved --> D[Wage sheet]
    D --> E([Labour cost in order costing])

    classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f
    class C decision
```

---

## Who Uses It

Each person logs in and lands on the page for their job.

```mermaid
flowchart LR
    Owner[Owner] --> P1["/dashboard<br/>Owner dashboard"]
    Supervisor[Supervisor] --> P2["/floor<br/>Floor dashboard"]
    Inspector[Quality Inspector] --> P3["/quality/queue<br/>Inspection queue"]
    Store[Store Keeper] --> P4["/inventory/stock<br/>Stock levels"]
    Accounts[Accounts] --> P5["/orders<br/>Orders"]
    Buyer[Buyer] --> P6["/orders<br/>Own orders"]
    Worker[Worker] --> P7["/worker/my-dashboard<br/>My dashboard"]
```

Wages, costing, profit and loss, and settings are **internal only**. The Buyer role is blocked from them and sent to a 403 page.

---

## Fabric Roll Life Cycle

Every roll follows fixed rules. A rejected roll can never be dispatched, and a reworked roll must be inspected again.

```mermaid
stateDiagram-v2
    [*] --> PRODUCED
    PRODUCED --> AWAITING_QC
    AWAITING_QC --> PASSED
    AWAITING_QC --> REWORK
    AWAITING_QC --> REJECTED
    REWORK --> AWAITING_QC: inspect again
    PASSED --> FINISHED_STOCK
    FINISHED_STOCK --> DISPATCHED
    REJECTED --> [*]
    DISPATCHED --> [*]
```

## Order Life Cycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> CONFIRMED
    CONFIRMED --> YARN_PENDING
    YARN_PENDING --> IN_PRODUCTION
    CONFIRMED --> IN_PRODUCTION
    IN_PRODUCTION --> QUALITY_CHECK
    QUALITY_CHECK --> READY_TO_SHIP
    READY_TO_SHIP --> DISPATCHED
    DISPATCHED --> CLOSED
    CLOSED --> [*]
```

An order can also be moved to `CANCELLED` from any stage before dispatch.

---

## How It Is Built

```mermaid
flowchart LR
    U["User<br/>browser / tablet"] --> C["React App<br/>(client)"]
    C -->|"REST + JWT token"| S["Express API<br/>(server)"]
    S --> R["Rules and security<br/>validation, roles, audit"]
    R --> P["Prisma ORM"]
    P --> D[("PostgreSQL")]
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Recharts |
| Forms and validation | React Hook Form, Zod |
| Exports and QR | jsPDF, xlsx, react-qr-code (client), qrcode (server) |
| Backend | Node.js, Express |
| Database | PostgreSQL with Prisma |
| Security | JWT login, role-based access, bcrypt password hashing, Helmet, rate limiting, input sanitising, audit log |

### What the backend enforces

- **Login and roles:** 7 roles (owner, store, supervisor, inspector, accounts, buyer, worker).
- **Status rules:** orders, machines, rolls and purchase orders can only move through allowed steps.
- **Stock rules:** stock changes are recorded as movements, never silently overwritten.
- **Business rules:** checks for inventory, orders, quality, dispatch, attendance and money.
- **Audit log:** important actions are recorded.

---

## Project Structure

```
TextileManagement/
├── client/                    React frontend
│   └── src/
│       ├── features/          one folder per module
│       │   ├── dashboard/     owner, floor, end-of-day
│       │   ├── inventory/     stock, suppliers, gate entry, POs
│       │   ├── orders/        orders, buyers
│       │   ├── production/    machine board, entry, downtime
│       │   ├── quality/       inspection queue, defects
│       │   ├── dispatch/      finished stock, dispatch, invoices
│       │   ├── hr/            workers, attendance, wages
│       │   ├── finance/       costing, profit and loss
│       │   ├── tracking/      public order tracking
│       │   └── settings/      mill, master data, users
│       ├── components/        shared layout and UI pieces
│       ├── services/          API calls
│       └── context/           login state
└── server/                    Express backend
    ├── prisma/                database schema, migrations, seed data
    └── src/
        ├── routes/            API endpoints
        ├── controllers/       request handlers
        ├── services/          business logic
        ├── middleware/        auth, security, errors
        ├── validators/        input checks
        └── utils/             business rules, status lifecycles, stock manager, QR, audit
```

---

## Run It Locally

**You need:** Node.js 18+, PostgreSQL 14+.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then set DATABASE_URL and JWT_SECRET
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev                 # runs on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # runs on http://localhost:5173
```

### Demo logins

The seed script creates one user per role. All use the password `Admin@123`.

| Role | Email |
|---|---|
| Owner | owner@textile.com |
| Store Keeper | store@textile.com |
| Supervisor | supervisor@textile.com |
| Inspector | inspector@textile.com |
| Accounts | accounts@textile.com |
| Buyer | buyer@textile.com |
| Worker | worker@textile.com |

Change these passwords before any real use.

---

## Demo Walkthrough

A suggested order for the presentation video:

| Step | Page | What to show |
|---|---|---|
| 1 | Home page, then Login | Landing page and role-based login |
| 2 | Owner dashboard (`/dashboard`) | Revenue, orders, production and quality at a glance |
| 3 | Inventory (`/inventory/stock`, `/inventory/gate-entries`) | Yarn stock, a new gate entry, low-stock warning |
| 4 | Orders (`/orders`) | Create a buyer order and check yarn availability |
| 5 | Machine board (`/production/machines`) | Which machine runs which order |
| 6 | Production entry and downtime | Daily output, breakdown log |
| 7 | Inspection queue (`/quality/queue`) | Pass, Rework or Reject a roll |
| 8 | Dispatch and invoices (`/dispatch`, `/invoices`) | Send passed rolls, generate the invoice |
| 9 | HR (`/hr/attendance`, `/hr/wages`) | Attendance and the wage sheet |
| 10 | Finance (`/finance/costing`, `/finance/pnl`) | Order cost, profit and loss |
| 11 | Public tracking (`/track`) | Buyer checks order status with no login |

---

## Current Status

| Area | Status |
|---|---|
| Frontend screens for all modules | Built |
| Login, roles, protected routes | Built |
| Backend business rules, status lifecycles, security middleware | Built |
| Database schema and migrations | Built |
| Backend test scripts (`server/test-*.js`) | Written for orders, stock, quality, dispatch, HR and security |
| Some screens (inventory, machine board, dashboards) | Still show sample data until fully connected to the live API |
| Planned next | Connect every screen to live data, face and RFID attendance, machine sensors, AI defect detection, buyer notifications |

---

## License

MIT
