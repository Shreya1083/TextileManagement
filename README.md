# Smart Textile Manufacturing, Traceability & Workforce Platform

**Purpose:** Build one unified platform that replaces notebooks, paper inspection slips, manual floor checks, phone calls, and attendance registers at Everest Textile Mills.

**Project status:** Specification and implementation plan. The modules and technologies described here are the target scope; a feature is not complete until implemented and tested in the running application.

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Vision and Goals](#2-vision-and-goals)
3. [Factory Workflow](#3-factory-workflow)
4. [Users and Permissions](#4-users-and-permissions)
5. [Complete ERP Modules](#5-complete-erp-modules)
6. [Smart Technology and AI/IoT Features](#6-smart-technology-and-aiiot-features)
7. [QR Workflows](#7-qr-workflows)
8. [Business Rules and Status Lifecycles](#8-business-rules-and-status-lifecycles)
9. [Technology Stack](#9-technology-stack)
10. [System Architecture](#10-system-architecture)
11. [Database Model](#11-database-model)
12. [API Design](#12-api-design)
13. [Frontend Pages and Routes](#13-frontend-pages-and-routes)
14. [Repository Structure](#14-repository-structure)
15. [Getting Started](#15-getting-started)
16. [Environment Configuration](#16-environment-configuration)
17. [Kiro Spec-Driven Development](#17-kiro-spec-driven-development)
18. [Development Roadmap](#18-development-roadmap)
19. [Testing and Acceptance Checklist](#19-testing-and-acceptance-checklist)
20. [Security, Privacy and Reliability](#20-security-privacy-and-reliability)
21. [Deployment](#21-deployment)
22. [GitHub Resources](#22-github-resources)
23. [Risks and Decisions to Confirm](#23-risks-and-decisions-to-confirm)
24. [Contributing](#24-contributing)
25. [License](#25-license)
26. [Source and scope note](#26-source-and-scope-note)

---

## 1. Problem Statement

Everest Textile Mills purchases yarn, processes it through spinning, weaving and dyeing, inspects the fabric, stores finished rolls and dispatches orders to buyers. Multiple buyers may have different fabric types, colours, quantities and deadlines at the same time.

The current-state problems described in the supplied problem statement are:

- Raw-material stock is tracked in a notebook.
- Machine and order status is checked by walking around the factory.
- Quality checks are recorded on paper slips.
- Buyer updates are given over phone calls.
- Worker attendance and wages are marked in a register.
- Orders can be delayed, machines can sit idle, and the actual cost of a fabric roll may be unknown.

The ERP must connect the complete workflow from yarn arriving at the gate to production, quality control, dispatch, invoicing, wages and month-end financial reporting.

Additional proposed innovation: QR traceability for fabric rolls; face recognition and RFID options for workforce workflows; IoT machine monitoring; AI-assisted quality inspection and operational insights. These are planned enhancements, not requirements stated in the original three-page problem statement unless separately agreed.

## 2. Vision and Goals

### Core business goals

- Know raw-material quantities, reservations, availability and reorder risk.
- Know which order is assigned to each machine, the current stage and today's output.
- Track idle machines, breakdowns, downtime and shift changes.
- Trace each fabric roll to its order, machine, production assignment and inspection result.
- Separate passed, rework and rejected rolls.
- Let authorized buyers see their order status and expected delivery date.
- Prevent incorrect or duplicate dispatches and match invoice quantities to dispatch quantities.
- Calculate material, labour and overhead costs and show order profitability.
- Connect approved attendance to wages and wages to order costing.
- Give each role a simple, task-focused interface suitable for factory-floor tablets.

### Product principles

- **One source of truth:** business records are stored in the central database.
- **Traceability:** critical actions produce linked records and history.
- **Backend-enforced rules:** hiding a button in the UI is not authorization.
- **Simple floor UX:** large controls, dropdowns, minimal typing and clear status badges.
- **Incremental delivery:** build a complete yarn-to-invoice workflow before adding every enhancement.
- **Honest status:** dashboards must use real API/database data in production, not permanent mock values.

## 3. Factory Workflow

```text
Supplier / Yarn Purchase
        |
        v
Gate Entry / Goods Receipt (GRN)
        |
        v
Yarn Lots + Stock Ledger + Availability Check
        |
        v
Buyer Order + Yarn Reservation / Purchase Order
        |
        v
Production Order and Work Assignment
        |
        v
Spinning -> Weaving -> Dyeing -> Finishing (as applicable)
        |
        v
Production Logs + Unique Fabric Roll IDs / QR Labels
        |
        v
Quality Inspection: Awaiting QC -> Pass / Rework / Reject
        |                      |
      Pass                   Rework
        v                      v
Finished-Goods Stock     Production / Re-inspection
        |
        v
Dispatch Selection -> Packing List -> Shipment
        |
        v
Invoice -> Buyer Payment / Outstanding Balance
        |
        v
Order Costing -> Machine Output -> Monthly P&L / Owner Dashboard
```

```mermaid
flowchart TD
    subgraph PROC["1. Procurement"]
        A([Supplier / Yarn Purchase]) --> B[Gate Entry / GRN]
        B --> C[Yarn Lots + Stock Ledger<br/>+ Availability Check]
    end

    subgraph PLAN["2. Order Planning"]
        D[Buyer Order +<br/>Yarn Reservation / PO]
        E[Production Order +<br/>Work Assignment]
        D --> E
    end

    subgraph PROD["3. Production"]
        F[Spinning] --> G[Weaving] --> H[Dyeing] --> I["Finishing<br/>(as applicable)"]
        I --> J[Production Logs +<br/>Unique Roll IDs / QR Labels]
    end

    subgraph QC["4. Quality Control"]
        K{Inspection<br/>Awaiting QC}
        M[Production /<br/>Re-inspection]
        X[Rejected<br/>recorded, not dispatchable]
        K -- Rework --> M
        M --> K
        K -- Reject --> X
    end

    subgraph DISP["5. Dispatch and Billing"]
        L[Finished-Goods Stock] --> N[Dispatch Selection<br/>-> Packing List -> Shipment]
        N --> O[Invoice -> Buyer Payment /<br/>Outstanding Balance]
    end

    subgraph FIN["6. Finance and Reporting"]
        P[Order Costing -> Machine Output<br/>-> Monthly P&L / Owner Dashboard]
    end

    C --> D
    E --> F
    J --> K
    K -- Pass --> L
    O --> P

    classDef start fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef bad fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    classDef done fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    class A start
    class K decision
    class X bad
    class P done
```

**Parallel workforce workflow:**

```text
Employee identity / approved attendance method
  -> Shift attendance record
  -> Supervisor review / correction audit
  -> Approved attendance + wage policy
  -> Wage sheet / payroll
  -> Labour cost allocation
  -> Order / roll costing
```

```mermaid
flowchart TD
    subgraph CAP["1. Attendance Capture"]
        W1([Employee identity /<br/>approved attendance method]) --> W2[Shift attendance record]
    end

    subgraph REV["2. Review"]
        W3{Supervisor review /<br/>correction audit}
        W3 -- Exception --> WC[Correction with reason,<br/>actor and timestamp]
        WC --> W3
    end

    subgraph PAY["3. Payroll"]
        W4[Approved attendance +<br/>wage policy] --> W5[Wage sheet / payroll]
    end

    subgraph COST["4. Costing"]
        W6[Labour cost allocation] --> W7[Order / roll costing]
    end

    W2 --> W3
    W3 -- Approved --> W4
    W5 --> W6

    classDef start fill:#d1fae5,stroke:#059669,color:#064e3b
    classDef decision fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef done fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    class W1 start
    class W3 decision
    class W7 done
```
## 4. Users and Permissions

The build plan defines six roles.

| Role | Main responsibilities | Typical access |
|---|---|---|
| Owner / Admin | Review costs, profit, output, wages; approve sensitive actions; manage users | Owner dashboard, reports, costing, user management |
| Store Keeper | Yarn gate entry, inventory, finished goods and dispatch | Inventory, gate entry, stock, dispatch |
| Production Supervisor | Assign machines, enter production, log downtime | Machine board, assignments, production entry, downtime |
| Quality Inspector | Inspect rolls and decide pass/rework/reject | Inspection queue, inspection form, defect reports |
| Office / Accounts | Buyers, orders, supplier POs, invoices, payments, wages | Orders, procurement, invoices, payments, payroll |
| Buyer (external) | View only their own order status and delivery estimate | Token-protected or authenticated tracking page |

```mermaid
flowchart LR
    Owner["Owner / Admin"] --> D1["Dashboard, reports, costing, users"]
    Store["Store Keeper"] --> D2["Gate entry, stock, finished goods, dispatch"]
    Sup["Production Supervisor"] --> D3["Machine board, assignments, production, downtime"]
    QI["Quality Inspector"] --> D4["Inspection queue, defects, roll decisions"]
    Acc["Office / Accounts"] --> D5["Orders, POs, invoices, payments, wages"]
    Buyer["Buyer - external"] --> D6["Own order tracking only, read-only"]
```

Permissions must be enforced by backend middleware/guards and checked again in the service layer for sensitive actions. The exact permission matrix should be reviewed with the factory before production deployment.

## 5. Complete ERP Modules

The source build plan describes approximately nine modules and a full application of roughly 28–31 named screens, with an MVP of about 18 screens. Its route inventory contains additional supporting/detail routes. Treat counts as planning estimates, not a hard limit.

### A. Login and setup

- Role-aware login.
- User and role management.
- Profile and password management.
- Mill settings: name, address, GSTIN, invoice prefix.
- Master data: shifts, stages, fabric types, yarn ratios and reorder defaults.

### B. Raw material and yarn inventory

- Supplier list and add/edit.
- Yarn catalog: type, count, colour, unit and reorder level.
- Gate Entry / Goods Receipt Note (GRN): supplier, yarn, colour, lot, quantity, bags/cones, vehicle, challan and receiving employee.
- Stock levels: current, reserved and available quantity; low-stock warnings.
- Read-only stock ledger with IN, OUT and ADJUST movements.
- Purchase orders, items, expected date and receive flow.

### C. Buyers and orders

- Buyer management.
- Fabric type master.
- Orders list filtered by status, buyer and deadline.
- New order with fabric type, GSM/width where applicable, colour, quantity in metres, rate per metre, deadline and notes.
- Yarn availability check using the fabric type's yarn-per-metre ratio.
- Shortage calculation and purchase-order suggestion.
- Order detail: timeline, stage progress, rolls, yarn issued, cost so far, dispatches and payments.

### D. Production floor

- Live machine board with machine, stage, status, active order, operator and today's output.
- Machine detail with output history and downtime.
- Work assignment: order, stage, machine, planned quantity, start date and shift.
- Daily production entry by date, shift, machine, order, output, waste and operator.
- Downtime/breakdown log with start, end, reason and notes.
- Machine status and maintenance events.

### E. Quality control

- Inspection queue ordered by oldest waiting roll.
- Inspection form with roll, inspector, defects, defect count/location, grade, result, remarks and optional photo.
- Defect types: hole, colour mismatch, uneven weave, stain and other configurable types.
- Pass / Rework / Reject decisions.
- Defect reports by type, machine, order and week, with drill-down.

### F. Buyer order tracking

- Public tracking search and order page.
- Access through order number plus a secure token or buyer login.
- Read-only status timeline: Spinning, Weaving, Dyeing, Quality Check, Ready to Ship and Dispatched, as applicable.
- Expected delivery date and authorized dispatch information.
- Never expose internal costs, employee data or another buyer's orders.

### G. Finished goods and dispatch

- Finished-goods stock by roll ID, order, buyer, length, grade and shelf/location.
- Dispatch creation: buyer, order, selected rolls, total metres, vehicle, driver and date.
- Packing-list generation and dispatch confirmation.
- One roll can only be dispatched once.
- Invoice generation/printing/PDF and dispatch quantity matching.

### H. Workers, attendance and wages

- Worker list, role and wage basis (daily wage or piece rate).
- Shift-wise attendance and overtime.
- Manual or bulk attendance marking with audit trail.
- Optional QR, RFID and face-recognition methods, subject to privacy and deployment decisions.
- Monthly wage sheet: days present, rate, overtime, deductions and net pay.
- Lock approved wage sheets after month close, with controlled corrections.

### I. Finance and owner reports

- Buyer payments and outstanding receivables.
- Expenses including power and miscellaneous costs.
- Order costing: yarn/material, labour, overhead, total cost, cost per good roll, invoice value and profit.
- Machine output report.
- Monthly profit-and-loss (P&L).
- Owner dashboard: revenue, cost, profit, machine output ranking, wages paid, receivables, low-stock count and delayed orders.

### Alerts and notifications

- Yarn stock below reorder level.
- Order deadline approaching or missed.
- Machine breakdown or prolonged idle time.
- Rolls waiting for QC longer than a configured threshold.
- Buyer payment overdue.
- Later optional channels: email and WhatsApp, only after provider, consent and template requirements are confirmed.

## 6. Smart Technology and AI/IoT Features

The technologies below solve different problems and should be integrated into the same ERP rather than treated as separate systems. Core ERP workflows should work even if optional hardware or AI services are unavailable.

| Use case | Candidate technology | ERP integration | Priority |
|---|---|---|---|
| QR fabric-roll labels | node-qrcode | Create roll ID, scan at QC/warehouse/dispatch | MVP/high |
| Browser QR scanner | html5-qrcode | Scan roll or attendance-session code | MVP/high |
| RFID floor login / attendance fallback | ESP32 + MFRC522/RC522 reader; card mapping in backend | Secure session or attendance event | Demo enhancement |
| Face attendance | Webcam + face-matching service; evaluate face-api.js, DeepFace or InsightFace | Attendance event and supervised review | Optional; privacy review first |
| Machine telemetry | ESP32 + appropriate meter/current/status sensor | Machine Board, output and downtime events | Optional |
| Vehicle plate recognition | Camera + OCR/ALPR component | Gate Entry and Dispatch vehicle number | Later |
| Fabric defect assistance | Camera + computer-vision model | Suggest defect label; inspector confirms | Later |
| Delay prediction | Historical planned vs actual progress | Deadline-risk alert | Later |
| Owner daily summary | AI-generated summary from authorized report data | Dashboard insight; link every claim to source data | Later |
| Buyer updates | Approved WhatsApp/email provider | Notify on permitted status transitions | Later |

### Recommended hackathon scope

Build a reliable vertical slice first:

1. QR labels for fabric rolls: generate at roll creation and scan at QC and dispatch.
2. Attendance demonstration: start with a secure QR/session or RFID card workflow; keep manual supervisor correction available.
3. One AI/IoT showcase: choose either defect-assistance on sample fabric images, simulated machine telemetry, or an owner daily summary.

Do not try to deliver every advanced feature at once. Face recognition can be impressive, but it is not required for the original problem statement. It introduces consent, bias, false-match, lighting, camera and data-retention concerns. If selected, use human review and a non-biometric alternative. Store biometric templates only if justified and approved; embeddings are still sensitive biometric data. Do not make wages depend solely on an unreviewed face match.

### Machine monitoring integration

An ESP32 device may publish machine state and meter readings to an authenticated API. The backend should validate device identity, timestamp and sensor values, deduplicate repeated events and record the source. A simulator can send the same event format for a stable demo.

### AI feature safeguards

- AI outputs are recommendations, not authoritative financial or quality decisions.
- An inspector confirms defect outcomes; an authorized manager confirms high-impact actions.
- Owner summaries must use authorized, current data and link to underlying reports.
- Do not send employee biometrics, payroll details or confidential buyer data to an external AI provider without an approved data-handling plan.

## 7. QR Workflows

### 7.1 Fabric-roll QR traceability

1. When a production event creates a roll, generate a unique ID such as `EVR-2026-000123`.
2. Save the roll record and its order, machine, assignment and production date.
3. Generate a QR label containing only an opaque roll identifier or a safe URL—not confidential business data.
4. Scan at quality inspection to open the correct roll and create the inspection record.
5. On pass, make the roll eligible for finished-goods stock.
6. Scan/select at dispatch; validate buyer/order, quality status, availability and prior dispatch.
7. Commit dispatch and stock movement in one database transaction.
8. Scanning later shows permitted traceability and dispatch history.

```mermaid
sequenceDiagram
    autonumber
    participant Sup as Supervisor
    participant API as Express API
    participant DB as PostgreSQL
    participant QI as Inspector
    participant Store as Store Keeper

    Sup->>API: Submit production entry
    API->>DB: Create roll EVR-2026-000123 linked to order, machine, assignment, date
    API-->>Sup: QR label with opaque roll ID / safe URL
    QI->>API: Scan roll QR at inspection
    API->>DB: Load roll, create inspection record
    alt Pass
        API->>DB: Roll PASSED, eligible for finished stock
    else Rework or Reject
        API->>DB: Save reason, route to rework or mark rejected
    end
    Store->>API: Scan or select roll at dispatch
    API->>DB: Validate buyer/order, QC status, availability, prior dispatch
    API->>DB: Single transaction - dispatch + roll status + stock movement
    API-->>Store: Dispatch confirmed
```

### 7.2 QR attendance

Recommended design: use a rotating or short-lived factory attendance-session QR, with an authenticated employee identity or a separate secure identification step. A static employee QR can be copied and shared.

1. An authorized manager configures the shift/session.
2. The employee authenticates and scans the valid session code.
3. The server validates employee status, shift window, token expiry and duplicate rules.
4. The server records the event and its timestamp.
5. Supervisors can review exceptions and submit corrections with a reason.
6. Approved attendance feeds configured wage calculations.

```mermaid
sequenceDiagram
    autonumber
    participant Mgr as Authorized Manager
    participant Emp as Employee
    participant API as Express API
    participant DB as PostgreSQL
    participant Sup as Supervisor

    Mgr->>API: Configure shift / session
    API-->>Mgr: Short-lived attendance-session QR
    Emp->>API: Authenticate and scan session code
    API->>API: Validate employee status, shift window, token expiry, duplicates
    alt Valid
        API->>DB: Record attendance event with server timestamp
        API-->>Emp: Attendance recorded
    else Invalid or expired
        API-->>Emp: Rejected
    end
    Sup->>API: Review exceptions, submit correction with reason
    API->>DB: Save correction + audit log
    DB-->>API: Approved attendance feeds wage calculation
```

### 7.3 RFID login and fallback

- Map each card UID to a card record, not directly to privileged permissions.
- A card tap should be combined with server-side checks and, where appropriate, a PIN or authenticated device/session.
- Support lost-card revocation and audit logs.
- Keep a manual supervisor-assisted fallback when hardware or scanning fails.

```mermaid
flowchart TD
    T["Card tap on ESP32 + RC522 reader"] --> V{"Device authenticated?"}
    V -->|No| X["Reject and log"]
    V -->|Yes| C{"Card UID mapped to active card record?"}
    C -->|No or revoked| X
    C -->|Yes| P{"PIN / session check required?"}
    P -->|Yes| PIN["Verify PIN or authenticated device"]
    P -->|No| E
    PIN --> E["Create secure session or attendance event"]
    E --> AUD["Audit log"]
    X --> F["Manual supervisor-assisted fallback"]
```

## 8. Business Rules and Status Lifecycles

These rules are central to data integrity and should be enforced in the database and backend—not just in the frontend.

### Inventory and yarn

- Stock balance is derived from stock movements; never silently overwrite a quantity.
- GRN quantity must be greater than zero.
- Challan number should be unique per supplier where that is the agreed business rule.
- Saving a GRN creates an IN movement.
- Issuing yarn to production creates an OUT movement linked to the order and adds the appropriate material cost.
- Available stock = current stock − reserved stock.
- When available stock is below the reorder level, show a warning.
- Required yarn = order quantity × yarn-per-metre ratio from the fabric-type master.
- If material is insufficient, show shortage and allow an authorized user to raise a PO.
- PO receipt must link to the GRN; support partial receipt.

### Orders and production

- Order quantity must be greater than zero; deadline must satisfy the mill's chosen validation rule.
- Order status can only follow permitted transitions.
- One machine can have at most one active assignment at a time.
- Do not assign work to a machine marked as broken or unavailable.
- Production output cannot be negative; record waste/scrap separately.
- Production events should be attributable to shift, machine, order and operator.
- Roll IDs must be unique and never reused.

### Quality and rolls

- Every roll must link to order, machine, work assignment and production date where those records exist.
- Inspection result is mandatory.
- Rework/reject requires a reason; rework must return to a defined production/reinspection flow.
- Only passed and released rolls can enter finished-goods stock.
- Rejected rolls remain recorded but are not dispatchable.
- Inspection changes and overrides must be audited.

### Dispatch and invoices

- Dispatch may include only eligible, available, passed rolls.
- All selected rolls in a dispatch must belong to the same buyer/order if following the source build plan's rule.
- A roll cannot be dispatched twice; enforce a database uniqueness/transaction rule.
- Dispatch posting, roll status changes and stock updates must be atomic.
- Invoice quantity must match the dispatch quantity.
- Lock issued invoices against silent edits; use controlled correction/credit-note processes where required.
- Payment allocation must not exceed the invoice's outstanding balance unless an explicit overpayment policy is defined.

### Attendance, wages and finance

- One worker should have one attendance state per shift, with duplicate scans handled idempotently.
- Manual corrections require a reason, actor, timestamp and audit trail.
- Wage calculation = approved attendance × configured rate, plus applicable overtime/piece-rate rules and less approved deductions.
- Lock wage sheets after month close; corrections need controlled reopening/adjustment.
- Money should use integer paise or an exact decimal type—not floating-point arithmetic.
- Cost calculations must be reproducible from recorded source transactions.

### Status lifecycles

- **Order:** `DRAFT -> CONFIRMED -> YARN_PENDING -> IN_PRODUCTION -> QUALITY_CHECK -> READY_TO_SHIP -> DISPATCHED -> CLOSED`
- **Machine:** `IDLE -> RUNNING -> BREAKDOWN -> IDLE` (maintenance states may be added)
- **Roll:** `PRODUCED -> AWAITING_QC -> PASSED | REWORK | REJECTED`; passed rolls can move to `FINISHED_STOCK -> DISPATCHED`
- **Purchase order:** `RAISED -> PARTIALLY_RECEIVED -> RECEIVED`
- **Rework:** return to the defined production/rework queue and require re-inspection before release.

The actual state transitions should be implemented as explicit server-side rules, with history records and tests.

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> CONFIRMED
    CONFIRMED --> YARN_PENDING
    YARN_PENDING --> IN_PRODUCTION
    IN_PRODUCTION --> QUALITY_CHECK
    QUALITY_CHECK --> READY_TO_SHIP
    READY_TO_SHIP --> DISPATCHED
    DISPATCHED --> CLOSED
    CLOSED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> RUNNING
    RUNNING --> BREAKDOWN
    BREAKDOWN --> IDLE
    RUNNING --> IDLE
```

```mermaid
stateDiagram-v2
    [*] --> PRODUCED
    PRODUCED --> AWAITING_QC
    AWAITING_QC --> PASSED
    AWAITING_QC --> REWORK
    AWAITING_QC --> REJECTED
    REWORK --> AWAITING_QC: re-inspection required
    PASSED --> FINISHED_STOCK
    FINISHED_STOCK --> DISPATCHED
    REJECTED --> [*]
    DISPATCHED --> [*]
```

```mermaid
stateDiagram-v2
    [*] --> RAISED
    RAISED --> PARTIALLY_RECEIVED
    PARTIALLY_RECEIVED --> PARTIALLY_RECEIVED: further partial receipt
    PARTIALLY_RECEIVED --> RECEIVED
    RAISED --> RECEIVED
    RECEIVED --> [*]
```

### Costing formula

```text
Order Cost = Yarn/material cost
           + Dyeing chemicals and other consumables
           + Labour allocated by machine-hours or output
           + Allocated power, maintenance and other overhead
           + Applicable wastage/rework cost

Cost per good roll = Order Cost / Number of good rolls produced
Order Profit       = Recognized invoice value - Order Cost
```

```mermaid
flowchart LR
    Y["Yarn / material cost"] --> OC
    Ch["Dyeing chemicals + consumables"] --> OC
    L["Labour by machine-hours or output"] --> OC
    OH["Power, maintenance, overhead"] --> OC
    W["Wastage / rework cost"] --> OC
    OC["Order Cost"] --> CPR["Cost per good roll = Order Cost / good rolls"]
    INV["Recognized invoice value"] --> PR
    OC --> PR["Order Profit = Invoice value - Order Cost"]
```

For the MVP, the build plan suggests average yarn rate, labour allocation by output share and a fixed overhead per metre. Document the chosen method and do not present estimates as audited accounting figures.

## 9. Technology Stack

The uploaded build plan recommends React/Vite/Tailwind, Node.js/Express, PostgreSQL/Prisma, JWT role-based access, Recharts, Docker and AWS EC2 (or a demo platform). The following stack stays close to that plan.

| Layer | Recommended choice | Role |
|---|---|---|
| Frontend | React + Vite + JavaScript/JSX (TypeScript optional) | Web application |
| Styling | Tailwind CSS + reusable component library | Responsive factory-friendly UI |
| Routing | React Router | Protected and public routes |
| API state | TanStack Query | Fetching, caching and refresh |
| HTTP | Axios | API client |
| Forms | React Hook Form + Zod | Validation |
| Charts | Recharts | Machine, cost and owner reports |
| Backend | Node.js + Express REST API | Business logic and endpoints |
| Validation | Zod or compatible request schemas | Validate all API input |
| Database | PostgreSQL | Transactional source of truth |
| ORM/migrations | Prisma | Data model and migrations |
| Authentication | JWT/session design + role-based middleware | Authenticated API access |
| QR generation/scanning | node-qrcode + html5-qrcode | Labels and browser scans |
| PDF/exports | Server-side PDF generation, ExcelJS or CSV | Invoice and report exports |
| Testing | Vitest/Jest + API tests + Playwright | Unit, integration and browser tests |
| Deployment | Docker; AWS EC2 or Render/Railway demo | Deployment |
| Optional async work | Redis + BullMQ | Background notifications/tasks |
| Optional real-time | Socket.IO or polling | Live machine board |
| Optional hardware | ESP32 + suitable sensors / RFID reader | Telemetry and card scanning |
| Optional AI | Separately deployed model/service | Defect assistance, summaries or prediction |

**Important:** choose one consistent implementation stack. Do not mix NestJS and Express as two competing backends unless there is a deliberate architectural reason. This README uses Express because it matches the uploaded Everest build plan and the proposed `/client` + `/server` structure.

## 10. System Architecture

```text
Users / Factory Tablets / Buyer Browser / Camera / RFID / ESP32
                         |
                         v
                React + Vite Client
                         |
                HTTPS / REST JSON
                         |
                         v
                Node.js + Express API
      +------------------+------------------+
      |                  |                  |
 Auth/Roles       Domain Modules     Device/API Adapter
      |                  |                  |
      +------------------+------------------+
                         |
                PostgreSQL + Prisma
                         |
      +------------------+------------------+
      |                  |                  |
Audit/Events      Reports/Exports     Optional Queue
                                            |
                                  Notifications / AI
```

```mermaid
flowchart TD
    U["Users / Factory Tablets / Buyer Browser / Camera / RFID / ESP32"] -->|HTTPS REST JSON| FE["React + Vite Client"]
    FE --> API["Node.js + Express API"]
    subgraph API_LAYER["Express API"]
        AUTH["Auth / Roles"]
        DOM["Domain Modules"]
        DEV["Device / API Adapter"]
    end
    API --> AUTH
    API --> DOM
    API --> DEV
    AUTH --> DB[("PostgreSQL + Prisma")]
    DOM --> DB
    DEV --> DB
    DB --> AUD["Audit / Events"]
    DB --> REP["Reports / Exports"]
    DB --> Q["Optional Queue - Redis + BullMQ"]
    Q --> N["Notifications / AI"]
```

Core modules must remain usable without optional AI services, sensors or external messaging providers. All device-originated data must be authenticated and validated before it changes authoritative records.

## 11. Database Model

The original build plan lists roughly 28 core tables; the exact count will depend on implementation details and audit/history tables.

### Suggested tables

**Identity and access**

- `users`
- `roles`
- Optional `user_roles` / permission tables if users can hold multiple roles.

**Inventory and procurement**

- `suppliers`
- `yarn_types`
- `yarn_stock_batches`
- `gate_entries`
- `stock_movements`
- `purchase_orders`
- `purchase_order_items`

**Buyers and orders**

- `buyers`
- `fabric_types`
- `orders`
- `order_items`
- `order_status_history`

**Production**

- `machines`
- `machine_stages`
- `work_assignments`
- `production_logs`
- `downtime_logs`

**Quality and traceability**

- `fabric_rolls`
- `inspections`
- `defects`
- Optional `roll_process_history` / `qr_code_records`

**Dispatch and billing**

- `finished_stock` or a derived view based on roll state and movements
- `dispatches`
- `dispatch_items`
- `invoices`
- `invoice_items`

**HR and finance**

- `workers`
- `shifts`
- `attendance`
- `wage_records`
- `payments`
- `expenses`

**Optional smart features**

- `rfid_cards` or `worker_credentials`
- `attendance_events` / `attendance_corrections`
- `device_registry`
- `machine_telemetry`
- `ai_inspection_suggestions`
- `notification_log`
- `audit_logs`

Avoid duplicating the same authoritative state in multiple tables without a clear ownership rule. Use foreign keys, indexes, uniqueness constraints and database transactions.

### Critical relationships

- `fabric_rolls.order_id -> orders.id`
- `fabric_rolls.machine_id -> machines.id` (where applicable)
- `fabric_rolls.work_assignment_id -> work_assignments.id`
- Each roll links to production date, inspection history and stock/dispatch events.
- `dispatch_items.roll_id` must be unique if each roll can only be dispatched once.
- `stock_movements` records the reason/reference for every stock change.
- Attendance records link worker, shift, date/event, source method and correction audit where applicable.

```mermaid
erDiagram
    USERS }o--|| ROLES : has
    SUPPLIERS ||--o{ GATE_ENTRIES : delivers
    YARN_TYPES ||--o{ GATE_ENTRIES : received_as
    GATE_ENTRIES ||--o{ STOCK_MOVEMENTS : creates_IN
    YARN_TYPES ||--o{ STOCK_MOVEMENTS : tracked_by
    SUPPLIERS ||--o{ PURCHASE_ORDERS : receives
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : contains
    PURCHASE_ORDERS ||--o{ GATE_ENTRIES : fulfilled_by

    BUYERS ||--o{ ORDERS : places
    FABRIC_TYPES ||--o{ ORDERS : specifies
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_STATUS_HISTORY : logs

    ORDERS ||--o{ WORK_ASSIGNMENTS : scheduled_in
    MACHINES ||--o{ WORK_ASSIGNMENTS : runs
    MACHINE_STAGES ||--o{ MACHINES : classifies
    WORK_ASSIGNMENTS ||--o{ PRODUCTION_LOGS : records
    MACHINES ||--o{ DOWNTIME_LOGS : suffers

    ORDERS ||--o{ FABRIC_ROLLS : yields
    MACHINES ||--o{ FABRIC_ROLLS : produces
    WORK_ASSIGNMENTS ||--o{ FABRIC_ROLLS : sources
    FABRIC_ROLLS ||--o{ INSPECTIONS : inspected_in
    INSPECTIONS ||--o{ DEFECTS : finds

    BUYERS ||--o{ DISPATCHES : receives
    DISPATCHES ||--o{ DISPATCH_ITEMS : contains
    FABRIC_ROLLS ||--o| DISPATCH_ITEMS : dispatched_once
    DISPATCHES ||--o| INVOICES : billed_by
    INVOICES ||--o{ INVOICE_ITEMS : contains
    INVOICES ||--o{ PAYMENTS : settled_by

    WORKERS ||--o{ ATTENDANCE : has
    SHIFTS ||--o{ ATTENDANCE : covers
    WORKERS ||--o{ WAGE_RECORDS : earns
```

## 12. API Design

Use REST JSON. Keep routes, controllers and services separated by module. The source steering sample suggests a consistent response envelope such as `{ "data": ..., "error": ... }`; document and apply one response/error convention consistently.

**Authentication**

- `POST /auth/login`
- `GET /auth/me`

**Inventory**

- `CRUD /suppliers`
- `CRUD /yarn-types`
- `POST /gate-entries`
- `GET /stock`
- `GET /stock/ledger`
- `CRUD /purchase-orders`
- `POST /purchase-orders/:id/receive`

**Buyers and orders**

- `CRUD /buyers`
- `CRUD /orders`
- `POST /orders/:id/check-yarn`
- `POST /orders/:id/confirm`
- `PATCH /orders/:id/status`

**Production**

- `GET /machines`
- `PATCH /machines/:id/status`
- `POST /assignments`
- `POST /production-logs`
- `POST /downtime`

**Quality**

- `GET /rolls?status=awaiting_qc`
- `POST /inspections`
- `GET /reports/defects`

**Dispatch and invoices**

- `GET /finished-stock`
- `POST /dispatches`
- `GET /invoices/:id`
- `GET /invoices/:id/pdf`

**Buyer tracking**

- `GET /track/:orderNo?token=...` — public, read-only and token-protected; expose status/dates only.

**HR and finance**

- `CRUD /workers`
- `POST /attendance`
- `POST /payroll/generate`
- `POST /payments`
- `GET /reports/order-costing`
- `GET /reports/machine-output`
- `GET /reports/monthly-pnl`

**Optional smart-device endpoints (proposed)**

- `POST /attendance/qr-scan`
- `POST /attendance/rfid-event`
- `POST /devices/:deviceId/telemetry`
- `POST /quality/ai-suggestions` or a private model-service integration
- `POST /notifications/test` (admin-only, non-production testing)

All write endpoints need authentication/authorization, validation, rate limits where appropriate, idempotency for repeated scans/events, and audit logging for sensitive actions.

## 13. Frontend Pages and Routes

The source build plan lists these routes and role restrictions as the basis for navigation. Adapt names as the application evolves.

| Route | Page | Roles |
|---|---|---|
| `/login` | Login | Public |
| `/track` | Buyer tracking search | Public |
| `/track/:orderNo` | Buyer order tracking | Public with token/auth |
| `/dashboard` | Owner dashboard | Owner |
| `/floor` | Floor dashboard | Owner, Supervisor |
| `/inventory/suppliers` | Suppliers | Owner, Store, Accounts |
| `/inventory/yarn` | Yarn catalog | Owner, Store |
| `/inventory/gate-entry/new` | Gate entry | Store |
| `/inventory/gate-entries` | Gate entry list | Owner, Store |
| `/inventory/stock` | Stock levels | Owner, Store, Supervisor, Accounts |
| `/inventory/ledger` | Stock ledger | Owner, Store |
| `/inventory/purchase-orders` | Purchase orders | Owner, Store, Accounts |
| `/inventory/purchase-orders/new` | Create PO | Store, Accounts |
| `/inventory/purchase-orders/:id` | PO detail | Owner, Store, Accounts |
| `/buyers` | Buyers | Owner, Accounts |
| `/fabric-types` | Fabric types | Owner, Accounts |
| `/orders` | Orders list | Owner, Store, Supervisor, Inspector, Accounts |
| `/orders/new` | New order | Owner, Accounts |
| `/orders/:id` | Order detail | Owner, Store, Supervisor, Inspector, Accounts |
| `/production/machines` | Machine board | Owner, Supervisor, Inspector |
| `/production/machines/:id` | Machine detail | Owner, Supervisor |
| `/production/machines/manage` | Machine management | Owner |
| `/production/assignments` | Work assignment | Supervisor |
| `/production/entry` | Daily production entry | Supervisor |
| `/production/downtime` | Downtime log | Supervisor |
| `/quality/queue` | Inspection queue | Inspector, Owner |
| `/quality/inspect/:rollId` | Inspection form | Inspector |
| `/quality/rolls/:rollId` | Roll detail | Owner, Supervisor, Inspector |
| `/quality/defects` | Defect report | Owner, Supervisor, Inspector |
| `/dispatch/stock` | Finished goods | Owner, Store |
| `/dispatch/new` | Create dispatch | Store |
| `/dispatch` | Dispatch list | Owner, Store, Accounts |
| `/dispatch/:id` | Dispatch detail | Owner, Store, Accounts |
| `/invoices` | Invoice list | Owner, Accounts |
| `/invoices/:id` | Invoice detail | Owner, Accounts |
| `/hr/workers` | Workers | Owner, Accounts |
| `/hr/attendance` | Attendance | Owner, Supervisor, Accounts |
| `/hr/wages` | Wage sheet | Owner, Accounts |
| `/finance/payments` | Payments | Owner, Accounts |
| `/finance/expenses` | Expenses | Owner, Accounts |
| `/finance/costing` | Order costing | Owner, Accounts |
| `/finance/machine-output` | Machine output report | Owner |
| `/finance/pnl` | Monthly P&L | Owner |
| `/settings/profile` | Profile | Authenticated users |
| `/settings/mill` | Mill settings | Owner |
| `/settings/master-data` | Master data | Owner |
| `/users` | User management | Owner |
| `/403`, `*` | Forbidden / not found | Public/error handling |

QR scanning screens, device status and AI suggestions can be added as features inside the relevant modules instead of creating an unrelated standalone application.

## 14. Repository Structure

The supplied Kiro build plan proposes a React client and Express server. A feature-based structure keeps each module's pages, components, hooks, schemas, routes, controllers, services and tests together.

```text
everest-textile-erp/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/                 # routes, providers, protected/role routes
│   │   ├── assets/
│   │   ├── config/              # roles, statuses, defect types
│   │   ├── lib/                 # axios, formatting, permissions, exports
│   │   ├── context/             # auth, toast, theme
│   │   ├── hooks/
│   │   ├── services/            # API calls only
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── table/
│   │   │   ├── layout/
│   │   │   ├── charts/
│   │   │   └── print/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   ├── production/
│   │   │   ├── quality/
│   │   │   ├── tracking/
│   │   │   ├── dispatch/
│   │   │   ├── hr/
│   │   │   ├── finance/
│   │   │   ├── settings/
│   │   │   └── smart-factory/   # optional QR/RFID/IoT/AI UI
│   │   ├── mocks/               # development only
│   │   └── tests/
│   ├── .env.example
│   └── package.json
├── server/
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── middleware/          # auth, roles, validation, errors
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── suppliers/
│   │   │   ├── inventory/
│   │   │   ├── buyers/
│   │   │   ├── orders/
│   │   │   ├── production/
│   │   │   ├── machines/
│   │   │   ├── rolls/
│   │   │   ├── quality/
│   │   │   ├── dispatch/
│   │   │   ├── invoices/
│   │   │   ├── workers/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   ├── finance/
│   │   │   ├── reports/
│   │   │   └── devices/         # optional RFID/IoT adapter
│   │   ├── utils/
│   │   └── tests/
│   └── package.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── .kiro/
│   ├── steering/
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── domain-rules.md
│   └── specs/
│       ├── foundation/
│       ├── inventory/
│       ├── orders/
│       ├── production/
│       ├── quality/
│       ├── dispatch-billing/
│       └── hr-finance/
├── docs/
├── tests/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Mock APIs and seeded sample data are for development/demo only. Production pages must use real authenticated API calls.

## 15. Getting Started

This README describes the intended architecture, not an already scaffolded repository. Confirm that the corresponding folders and scripts exist before running commands.

### Prerequisites

- Git
- Node.js LTS and npm
- Docker Engine/Desktop and Docker Compose
- PostgreSQL (or the Docker service)
- Visual Studio Code or another editor
- Optional: Kiro for spec-driven development

### Clone the repository

Replace the placeholder with your actual GitHub repository URL:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd everest-textile-erp
```

### Create the client

If the client has not been scaffolded:

```bash
npm create vite@latest client -- --template react
cd client
npm install
```

Install the dependencies selected for the actual codebase (for example React Router, TanStack Query, Axios, React Hook Form, Zod, Tailwind CSS and Recharts). Use the current installation instructions from each project's official repository/documentation.

### Create the server

From the repository root, if the server does not exist:

```bash
mkdir server
cd server
npm init -y
npm install express cors helmet dotenv zod @prisma/client
npm install --save-dev prisma nodemon
```

Create an Express app, configure scripts and environment loading, then add authentication and module routes. Do not assume these commands create the full API automatically.

### Configure Prisma

From the repository root or the chosen Prisma workspace:

1. Configure `DATABASE_URL`.
2. Create `prisma/schema.prisma`.
3. Review the schema and constraints.
4. Create and apply a development migration using the installed Prisma version's supported commands.
5. Seed only fictional development data.

Never run an unreviewed migration against production data.

### Run the project

The exact scripts depend on the actual `package.json` files. Add documented scripts such as `dev`, `build`, `test`, `lint` and `db:migrate` only when implemented. If client and server are separate, run them in separate terminals until a root workspace script is configured.

## 16. Environment Configuration

Create local `.env` files from `.env.example`. Do not commit real secrets.

Illustrative root `.env.example`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/everest_textile
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173

# Optional; only if Redis is enabled
REDIS_URL=redis://localhost:6379

# Optional external services; configure only when selected
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
WHATSAPP_PROVIDER=
AI_PROVIDER_API_KEY=
```

Use separate secrets for development, staging and production. Keep biometric records, payroll data and production credentials out of source control, logs and screenshots.

## 17. Kiro Spec-Driven Development

The supplied build plan recommends creating three artifacts for each feature: `requirements.md`, `design.md` and `tasks.md`, guided by steering files.

### Steering files

- `.kiro/steering/product.md`: product purpose, roles, factory context and UX principles.
- `.kiro/steering/tech.md`: stack, folders, naming conventions, API response format and testing.
- `.kiro/steering/domain-rules.md`: inventory, roll, dispatch, invoice, status and costing rules.

### Recommended spec order

| Order | Spec | Scope | Depends on |
|---|---|---|---|
| 0 | foundation | Setup, database, authentication, six roles, base layout, seed data | None |
| 1 | inventory | Suppliers, yarn, GRN, stock ledger, low-stock alert, PO | Foundation |
| 2 | orders | Buyers, orders, yarn availability, reservations, status history | Inventory |
| 3 | production | Machines, assignments, logs, downtime, roll creation | Orders |
| 4 | quality | Inspection queue, defects, rework, traceability | Production |
| 5 | dispatch-billing | Finished stock, QR scan, dispatch, invoices, buyer tracking | Quality |
| 6 | hr-finance | Workers, attendance, wages, payments, costing, owner reports | Foundation and relevant business modules |
| 7 | smart-factory (optional) | RFID/face/IoT/AI integrations with fallback paths | Stable core workflows |

```mermaid
flowchart LR
    S0["0 foundation"] --> S1["1 inventory"]
    S1 --> S2["2 orders"]
    S2 --> S3["3 production"]
    S3 --> S4["4 quality"]
    S4 --> S5["5 dispatch-billing"]
    S0 --> S6["6 hr-finance"]
    S5 --> S6
    S5 -.-> S7["7 smart-factory - optional"]
    S6 -.-> S7
```

### Example prompts for Kiro

**Foundation**

> Create a spec for the Everest Textile Mills project foundation using a React client, Express REST API, PostgreSQL with Prisma, JWT authentication, six roles, protected routes, role-specific navigation, audit logging and fictional seed users. Follow the steering files.

**Inventory**

> Create a spec for supplier management, yarn catalog with reorder levels, gate entry/GRN, automatic stock ledger IN entries, stock levels, low-stock alerts and purchase orders with partial receipt. Enforce rules in the database/API and include acceptance tests.

**Orders**

> Create a spec for buyer and order management, fabric specifications, yarn availability based on the fabric-type yarn-per-metre ratio, shortage calculation, yarn reservation, PO suggestion and validated order status transitions with history.

**Production**

> Create a spec for machine status, one active assignment per machine, work assignments, shift-wise production logs, waste, downtime and automatic unique fabric-roll creation linked to order, machine, assignment and production date.

**Quality**

> Create a spec for an oldest-first inspection queue, configurable defect types, defect location/count, pass/rework/reject outcomes, mandatory reasons for rework/rejection and roll traceability to order/machine/assignment.

**Dispatch and billing**

> Create a spec for finished-goods stock, QR roll lookup, dispatch selection, same-buyer/order validation, database-level duplicate-dispatch prevention, packing list, invoice quantity matching and token-protected buyer tracking.

**HR and finance**

> Create a spec for workers, shifts, attendance, approved manual corrections, wage generation, payments, expenses, order costing, machine-output reports and monthly P&L. Document wage and costing assumptions and add tests.

**Optional smart factory**

> Create a separate spec for the selected smart feature only. Define device/model boundaries, privacy and security controls, event validation, fallback/manual operation, audit logging and acceptance tests. Do not block core ERP workflows if the external device or AI service is unavailable.

After each spec, review the design, database constraints, role permissions, seed data and tests before generating or executing tasks.

## 18. Development Roadmap

```mermaid
flowchart TD
    P1["Phase 1 - Foundation<br/>repo, DB, login, roles, layout, audit"]
    P2["Phase 2 - Inventory<br/>suppliers, GRN, ledger, PO"]
    P3["Phase 3 - Buyers and orders<br/>availability, reservation, history"]
    P4["Phase 4 - Production<br/>machines, assignments, logs, roll IDs"]
    P5["Phase 5 - Quality and QR<br/>inspection, defects, rework, QR"]
    P6["Phase 6 - Dispatch and billing<br/>dispatch, invoice, buyer tracking"]
    P7["Phase 7 - HR and finance<br/>attendance, wages, costing, P&L"]
    P8["Phase 8 - Demo innovation<br/>RFID, telemetry, AI - pick one or two"]
    P9["Phase 9 - Production hardening<br/>security, backups, deployment, training"]
    P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```

### Phase 1 — Foundation

- Repository, environment, database, migrations and seed script.
- Login, roles, protected routes and role-specific navigation.
- Shared layout, error handling and audit log.
- Smoke tests and fictional demo users.

### Phase 2 — Inventory

- Suppliers, yarn types, GRN, stock batches, stock ledger, low-stock alerts and PO receipt.
- Verify stock increases/decreases from movements and partial receipts.

### Phase 3 — Buyers and orders

- Buyers, fabric types, orders, yarn availability and reservation.
- Shortage/PO suggestion, status history and order detail.

### Phase 4 — Production

- Machine management and board.
- Assignments, shift-wise production entry, waste and downtime.
- Unique roll IDs linked to production source records.

### Phase 5 — Quality and QR traceability

- Inspection queue and form.
- Defect reporting and rework flow.
- QR generation/scan; only released passed rolls enter finished stock.

### Phase 6 — Dispatch and billing

- Finished stock, roll selection, dispatch, packing list, invoice PDF and buyer tracking.
- Transactional duplicate-dispatch protection and quantity reconciliation.

### Phase 7 — HR and finance

- Workers, shifts, attendance, supervised correction, wages and payment recording.
- Costing, machine output, receivables and monthly P&L.

### Phase 8 — Demo innovation

- Select one or two: RFID reader, simulated/real machine telemetry, AI defect suggestion or owner summary.
- Keep manual/software fallback ready.

### Phase 9 — Production hardening

- Access-control review, load and end-to-end tests, backups/restore, monitoring, deployment, operator training and data migration.

## 19. Testing and Acceptance Checklist

Use the checklist as a release gate. Mark an item complete only after it passes against the running application.

### Inventory and procurement

- [ ] GRN records supplier, yarn type, colour, count, lot/batch, quantity in kg, bags/cones, vehicle, challan, optional order and receiver.
- [ ] GRN quantity must be positive and challan uniqueness is enforced per agreed rule.
- [ ] GRN creates an IN stock movement.
- [ ] Stock page displays current, reserved and available stock.
- [ ] Low-stock alert uses available stock and reorder level.
- [ ] Ledger is read-only; corrections use ADJUST movements.
- [ ] Purchase orders support items, rates, expected date, status and partial receipt linked to GRNs.
- [ ] Yarn availability and shortage calculations match the fabric-type ratio.

### Orders and production

- [ ] Orders support buyer, fabric type/specification, colour, quantity, rate, deadline and notes.
- [ ] Order status changes follow the defined state machine and are historized.
- [ ] One machine cannot have two active assignments.
- [ ] Broken machines cannot receive assignments.
- [ ] Production entry records date, shift, machine, order, output, waste and operator.
- [ ] Output cannot be negative; roll creation produces a unique ID.
- [ ] Downtime end is after start and downtime appears in reports.

### Quality and traceability

- [ ] Inspection queue sorts oldest first.
- [ ] Defect types include hole, colour mismatch, uneven weave, stain and other.
- [ ] Result is mandatory; rework/reject requires reason.
- [ ] Every roll can be traced to order, machine, assignment and production date.
- [ ] Only passed/released rolls enter finished stock.
- [ ] Rework returns to production/reinspection; rejected rolls cannot be dispatched.
- [ ] Defect reports filter by type, machine, order and time.

### Buyer tracking, dispatch and invoices

- [ ] Buyer sees only their authorized order status and expected date.
- [ ] Dispatch includes buyer/order, selected rolls, total quantity, vehicle, driver and date.
- [ ] Dispatch contains only eligible passed, available and undispatched rolls.
- [ ] A repeated dispatch attempt is rejected by API and database constraints.
- [ ] Invoice quantity matches dispatch quantity and issued invoice edits are controlled.
- [ ] Finished-goods stock and dispatch history reconcile.

### Attendance and payroll

- [ ] One worker cannot accidentally create duplicate attendance for the same shift.
- [ ] QR/session tokens are validated and expired/invalid scans are rejected.
- [ ] RFID card loss/revocation and fallback are handled if RFID is enabled.
- [ ] Biometric matching is never the only path for attendance correction.
- [ ] Manual corrections include actor, reason and timestamp.
- [ ] Wage sheet uses approved attendance, configured wage basis, overtime and deductions.
- [ ] Month-close lock and controlled adjustment are tested.

### Finance, security and operations

- [ ] Costs are traceable to material, labour, overhead and output records.
- [ ] Payment cannot exceed outstanding amount unless explicit policy permits it.
- [ ] Dashboard values match reports and database records.
- [ ] Backend authorization is tested for both allowed and denied roles.
- [ ] Input validation, error handling, audit logging and transaction rollback are tested.
- [ ] Database backup and restore have been rehearsed.
- [ ] Secrets and real employee/customer data are not committed.
- [ ] Dependency and repository licenses are reviewed.
- [ ] Demo can run if optional hardware/AI services fail.

## 20. Security, Privacy and Reliability

- Enforce role permissions on the server for every protected route and action.
- Hash passwords with a suitable password-hashing algorithm; use HTTPS in production.
- Use short-lived sessions/tokens, secure cookies or carefully managed bearer tokens, and revocation where applicable.
- Do not trust a QR payload or RFID UID by itself as authorization.
- Validate device identity, timestamps and payload shape for IoT telemetry.
- Apply rate limits and idempotency to repeated attendance, QR and telemetry events.
- Use database transactions for stock movement, dispatch, payroll approval and financial posting.
- Record audit history for stock adjustments, attendance corrections, QC overrides, dispatch and finance.
- Restrict access to buyer tracking tokens and avoid exposing internal costs or personal data.
- Store secrets in environment/secret management, never in Git.
- Back up the database and test restoration; define retention and access controls for backups.
- Biometric data, including face embeddings, is sensitive. Before enabling face recognition, obtain appropriate informed consent, provide a non-biometric alternative, define retention/deletion and access policies, evaluate false matches and document applicable legal obligations. Seek qualified legal advice for compliance requirements.
- AI suggestions must be reviewable and must not automatically finalize high-impact quality, payroll or financial decisions.

## 21. Deployment

### Suggested deployment path

- **Development:** Docker Compose for PostgreSQL and optional Redis; client and server run locally.
- **Hackathon/demo:** deploy client and API to a suitable hosting provider; use a managed PostgreSQL instance or secured database service.
- **Production:** HTTPS, private database networking, least-privilege credentials, backups, monitoring, migrations, error tracking and a tested rollback plan.

The supplied plan mentions Docker + AWS EC2, with Render/Railway as demo alternatives. Select the deployment target based on budget, team familiarity, data sensitivity and operational support.

### Go-live steps

1. Configure production environment variables and secrets.
2. Run reviewed migrations against a backed-up database.
3. Create initial admin credentials securely; never ship public default passwords.
4. Verify HTTPS, CORS, API authorization and database network restrictions.
5. Load only validated, authorized factory data.
6. Run end-to-end acceptance tests with realistic sample orders.
7. Train each role and document manual fallback procedures.
8. Monitor errors, backups, failed scans, delayed orders and stock reconciliation after launch.

## 22. GitHub Resources

These are technology repositories and project references, not a claim that any one repository implements the full Everest requirements. Check availability, license, maintenance, security and actual feature completeness before reusing code.

**Textile/manufacturing ERP references**

- Textile ERP Next.js
- Fabric ERP
- Carbon manufacturing ERP
- ERPNext
- Odoo

**Frontend and UI**

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Recharts

**Backend, database and security**

- Node.js
- Express
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Socket.IO
- Passport
- node-argon2
- Swagger UI

**QR, RFID and IoT**

- node-qrcode
- html5-qrcode
- ESP-IDF
- Arduino ESP32 core
- MFRC522 Arduino library

RFID/ESP32 libraries are firmware-side components; they do not provide a complete secure ERP integration by themselves.

**Computer vision / face recognition candidates**

- face-api.js
- DeepFace
- InsightFace

Evaluate model licences, intended use, accuracy, deployment and privacy before adoption. Do not assume every model or pretrained weight has the same licence as its code repository.

**Reports, files and notifications**

- ExcelJS
- pdfmake
- Nodemailer
- Multer
- MinIO
- Day.js

**Testing, deployment and monitoring**

- Docker Engine / Moby
- Docker Compose
- GitHub Actions runner
- Vitest
- Playwright
- Sentry
- Prometheus
- Grafana

**Hardware to evaluate (not GitHub links)**

- ESP32 development board.
- MFRC522/RC522 RFID reader and test cards.
- Suitable machine meter/current/status sensor, chosen after electrical and safety review.
- Camera/webcam for optional face attendance or fabric inspection.
- QR-capable phone/tablet and label printer.
- Verify electrical compatibility and machine safety before connecting sensors to industrial equipment.

## 23. Risks and Decisions to Confirm

Resolve these with the factory/team before production implementation:

- Units and conversions: yarn in kg/cones/bags; fabric in metres, kg or rolls.
- Fabric master fields: type, colour, GSM, width and any mill-specific specification.
- Yarn consumption ratio and how reservations, partial issues, returns and wastage work.
- Production stages used for each fabric type and the meaning of completion at each stage.
- Attendance policy: shift windows, overnight shifts, breaks, grace periods, overtime and corrections.
- Whether face recognition is justified, consented to and legally reviewed; which non-biometric fallback is available.
- RFID card policy, lost cards, device trust and whether card tap alone is enough for the intended action.
- Which machine signals can be safely measured and whether a simulator is sufficient for the demo.
- Quality defect taxonomy, grading scale, inspection photos and who may override decisions.
- Costing method: average/FIFO yarn cost, labour allocation, overhead allocation, wastage and rework.
- GST/invoice configuration and financial/accounting requirements.
- Buyer portal authentication and what delivery information can be public.
- WhatsApp/email provider, notification consent and template approvals.
- Offline requirements and how to handle unverified scans during network outages.
- Backup retention, data migration, retention/deletion policy and support ownership.

## 24. Contributing

1. Create a feature branch.
2. Keep module code and tests together.
3. Write or update acceptance tests for business rules.
4. Do not commit secrets, biometric records or real employee/customer data.
5. Include screenshots for UI changes and test results for workflow changes.
6. Update this README when routes, environment variables, setup scripts or implemented features change.
7. Open a pull request with a clear summary and known limitations.

## 25. License

No license has been selected for this project yet. Add a `LICENSE` file after deciding how the project may be used, modified and distributed. Third-party code and model weights retain their own licences; review them separately before reuse.

## 26. Source and scope note

This README combines the supplied Textile Manufacturing System problem statement (the yarn receipt, production floor, QC, buyer update, dispatch and month-end finance scenarios) with the supplied Everest Textile Mills – Build Plan for Kiro (roles, screen/routes, database outline, business rules, APIs, costing, Kiro workflow and suggested stack). QR fabric-roll traceability and the optional face/RFID/IoT/AI enhancements are included from the subsequent project discussion. Where the source plan gives estimates, they are described as estimates. Where implementation choices were not settled, they are marked as proposed or requiring confirmation.

---

## Additional Completeness Review

This addendum captures cross-cutting requirements that are easy to miss when building the individual ERP modules. It supplements the sections above; it does not replace the source problem statement or the Everest Textile Mills build plan.

### Requirements Traceability Matrix

Use this matrix to make sure every problem in the factory workflow maps to an implemented screen, data record, business rule and test.

| Factory problem / need | ERP capability | Evidence required before marking complete |
|---|---|---|
| Paper-based yarn register | GRN, yarn lots, stock ledger | Receipt creates a traceable stock movement |
| Unknown material availability | Current/reserved/available stock and yarn check | Order check reports required, available and shortage quantities |
| Manual machine checks | Machine board, assignments and status history | Status and active order match persisted records |
| Machine idle time / breakdown | Downtime log and reports | Duration and reason appear in production reporting |
| Paper quality slips | Inspection queue, defect records and decisions | Roll history shows inspector, result, defects and timestamps |
| Repeated floor-walking / buyer calls | Buyer tracking and internal order timeline | Authorized viewer sees current stage and estimated date |
| Duplicate or incorrect dispatch | Roll eligibility checks and atomic dispatch | Concurrent/repeated requests cannot dispatch the same roll twice |
| Unclear invoice reconciliation | Invoice-to-dispatch linkage | Invoice quantity and amount can be reconciled to dispatch records |
| Attendance register | Attendance events and shift rules | Duplicate scans and authorized corrections are handled and audited |
| Unclear wages | Wage sheet and configured policy | Payroll can be reproduced from approved attendance and wage rules |
| Unknown order profitability | Order costing and finance reports | Cost totals trace to source transactions and declared allocation rules |
| New smart-factory ideas | Separate optional QR/RFID/IoT/AI adapters | Core ERP remains usable when an adapter is disabled |

### Non-Functional Requirements

Agree on measurable targets with the factory/team before production launch. The values below are proposed targets, not requirements stated in the source documents.

- **Usability:** common floor tasks should require minimal typing and provide clear success/error feedback.
- **Performance:** agree response-time targets for common list/detail pages and reports; test with realistic record volumes.
- **Availability:** document maintenance windows, outage communication and recovery expectations.
- **Data integrity:** stock, dispatch, invoice, payroll and payment operations must be transactional and auditable.
- **Security:** deny access by default; test each role against both permitted and prohibited actions.
- **Maintainability:** use module boundaries, consistent validation, linting, migrations and automated tests.
- **Accessibility:** keyboard support, visible focus, readable contrast, labelled form controls and understandable error messages.
- **Responsive design:** test desktop, shared tablets and phone-sized QR scanning views.
- **Localization:** configure INR, date/time format, units, mill timezone and GST/invoice settings only after confirming business requirements.
- **Recoverability:** define recovery point/recovery time objectives with the owner and test restore procedures.
- **Interoperability:** provide controlled CSV exports/imports and documented API contracts where operationally needed.

### API Conventions and Error Handling

Document these conventions in the API design and apply them consistently:

- Use plural resource names and consistent HTTP methods/status codes.
- Validate path parameters, query parameters and request bodies on the server.
- Return a predictable success/error structure; never expose stack traces, secrets or SQL errors to clients.
- Include a request/correlation ID in logs and error responses where appropriate.
- Use pagination and server-side filtering/sorting for large lists such as stock ledger, orders, production logs and attendance.
- Use idempotency keys or equivalent uniqueness rules for actions that can be retried, especially attendance events, device telemetry and dispatch posting.
- Use optimistic concurrency/version checks where two users might edit the same record.
- Document authentication, roles, request examples, response schemas and error cases in OpenAPI/Swagger or an equivalent API specification.
- Rate-limit login, public tracking and scanner/device endpoints according to their threat model.
- Keep public buyer tracking read-only and return only approved fields.

Suggested error categories include validation failure, unauthenticated, forbidden, not found, conflict/state-transition failure, rate limited and internal server error. Do not return a successful response until the database transaction has committed.

### Audit, Events and Record Retention

For critical business actions, store who did what, when, against which record, and why where relevant. Audit at minimum:

- User/role changes and login security events.
- GRN creation, stock adjustment and yarn issue/return.
- Order status transitions and production assignment changes.
- Machine breakdown and maintenance updates.
- Quality decision, rework, rejection and overrides.
- Attendance correction, wage approval and payroll reopening.
- Dispatch confirmation, invoice issuance, payment allocation and cost adjustments.
- Changes to QR/RFID credentials, device registration and AI-assisted decisions.

Audit logs should be append-only to ordinary application users; restrict access and avoid copying passwords, access tokens, biometric templates or unnecessary personal data into logs. Define retention and deletion periods with the business owner and applicable obligations.

### Data Migration, Import and Export

If the mill moves from notebooks or spreadsheets, plan a controlled migration instead of importing raw files directly into production.

- Agree on master data formats for suppliers, buyers, yarn types, fabric types, machines, workers and shifts.
- Clean duplicates, inconsistent units, missing IDs and invalid dates.
- Import into a staging environment first.
- Validate totals, opening stock, outstanding invoices and current order states with the responsible employee.
- Keep a migration report with row counts, rejected rows and corrections.
- Obtain approval before posting opening balances to production.
- Restrict exports containing employee, wage, buyer or financial information.
- Record important imports/exports in an audit log.

CSV exports should be protected against spreadsheet formula injection, and import endpoints must validate file type, size, headers, values and authorization.

### Backup, Disaster Recovery and Operational Runbooks

Document and test:

- Automated database backups and retention policy.
- Encrypted backup storage and restricted access.
- Periodic restore drills into a separate environment.
- Recovery point and recovery time objectives approved by the owner.
- Rollback procedure for failed releases and migrations.
- Procedure for lost RFID cards, failed cameras, QR scanner outages and ESP32/device disconnection.
- Manual fallback for attendance and production entry, including later reconciliation and audit.
- Contact/ownership for incidents, deployment and database maintenance.

A backup is not considered verified until restoration has been tested.

### Observability and Support

Production operations should include:

- Structured application logs with request IDs and severity levels.
- Monitoring for API errors, database connectivity, job failures and resource usage.
- Alerts for repeated scan failures, delayed orders, low stock, machine downtime and failed notifications where those features are enabled.
- Health/readiness endpoints that do not reveal secrets or sensitive infrastructure details.
- A support procedure for reporting incorrect stock, roll status, attendance or invoice records.
- Versioned release notes and a record of database migrations applied.

Do not log full QR tokens, buyer tracking tokens, passwords, secret keys, biometric data or full payment details.

### Optional Integrations: Failure Modes and Fallbacks

| Integration | Expected failure cases | Required fallback |
|---|---|---|
| QR camera scan | Poor lighting, damaged label, unsupported camera permission | Manual roll-ID search by authorized user, with normal validation |
| RFID reader/card | Unreadable card, lost card, disconnected reader | Revocation flow and supervised alternative |
| Face matching | Low light, mask/appearance changes, false match, camera failure | Manual review and non-biometric method; no automatic wage penalty |
| ESP32 telemetry | Network outage, stale timestamp, repeated events, invalid device | Show stale/offline status; do not fabricate machine readings |
| Defect model | Low confidence, unsupported fabric, service unavailable | Inspector records result manually |
| OCR/vehicle plate | Blurred/obstructed plate or wrong reading | Human confirmation before saving gate/dispatch record |
| WhatsApp/email | Provider outage, invalid destination, delivery failure | Queue/retry safely, log status and show internal notification |
| AI owner summary | Stale/incomplete data, unsupported claim, provider outage | Show source-linked reports and mark summary unavailable |

```mermaid
flowchart LR
    QRc["QR camera scan"] -. fails .-> QRf["Manual roll-ID search + normal validation"]
    RF["RFID reader / card"] -. fails .-> RFf["Card revocation + supervised alternative"]
    FM["Face matching"] -. fails .-> FMf["Manual review + non-biometric method"]
    ESP["ESP32 telemetry"] -. fails .-> ESPf["Show stale/offline status, no fabricated data"]
    AI["Defect model"] -. fails .-> AIf["Inspector records result manually"]
    OCR["Plate OCR"] -. fails .-> OCRf["Human confirmation before saving"]
    MSG["WhatsApp / email"] -. fails .-> MSGf["Queue, retry, internal notification"]
    SUM["AI owner summary"] -. fails .-> SUMf["Source-linked reports, summary marked unavailable"]
```

### Demo Readiness Checklist

For a reliable hackathon or stakeholder demonstration:

- [ ] Use fictional employee, buyer, supplier and order data.
- [ ] Prepare one end-to-end example: yarn GRN → order → production → roll QR → QC → finished stock → dispatch → invoice → payment/cost report.
- [ ] Prepare at least one low-stock scenario and one machine-breakdown scenario.
- [ ] Prepare pass, rework and reject examples.
- [ ] Demonstrate that a second dispatch of the same roll is blocked.
- [ ] Demonstrate attendance scan validation and supervisor correction audit.
- [ ] Use a simulator for RFID/ESP32/camera when physical hardware is unavailable.
- [ ] Show AI output as a suggestion and demonstrate human confirmation.
- [ ] Keep a fallback recording or screenshots for hardware-dependent features.
- [ ] Make clear which data is live, simulated or seeded.
- [ ] Do not present simulated sensor data or mock API responses as real factory telemetry.

### Definition of Done

A feature is complete only when all relevant conditions are met:

1. Requirements and acceptance criteria have been reviewed.
2. Database schema and migration are reviewed and reproducible.
3. Backend validation, permissions and business rules are implemented.
4. Frontend loading, empty, success and failure states are implemented.
5. Unit and integration tests cover important rules and failure cases.
6. Role permissions and negative authorization tests pass.
7. Audit/history behaviour is implemented for sensitive changes.
8. Documentation, API contracts and environment examples are updated.
9. No secrets or real personal/financial data are committed.
10. The feature is demonstrated against persisted data, not only a mock.
11. Known limitations and any manual fallback are documented.
12. The release can be rolled back or recovered using the agreed operational procedure.

### Final Scope Boundary

The original problem statement and the Everest Textile Mills build plan define the core business requirements. Face recognition, RFID-based floor login, ESP32 sensors, vehicle OCR, AI defect detection, AI summaries, delay prediction and WhatsApp notifications are enhancements proposed in the subsequent project discussion. Keep each enhancement optional, separately testable and replaceable. Confirm costs, device compatibility, model licensing, privacy requirements and factory policy before committing to a production implementation.

---

## 37. Prediction and Advanced Analytics Module

### 37.1 Purpose

Add a dedicated Prediction & Analytics module to turn historical ERP transactions into measurable insights, forecasts, risk indicators, and management recommendations. This module is a proposed enhancement; it is not evidence that predictive models have already been trained or deployed.

The module must distinguish three types of output:

- **Descriptive analytics:** what happened (for example, last week's production and defect rate).
- **Diagnostic analytics:** what appears to have contributed to an outcome (for example, defect rate by machine, fabric type, shift, or supplier).
- **Predictive analytics:** what may happen next (for example, expected demand or a batch's estimated defect risk).
- **Prescriptive guidance:** which actions may help (for example, inspect a machine or reorder yarn). Recommendations should explain their basis and require authorized human approval for consequential actions.

### 37.2 Initial dashboard

Provide a role-protected dashboard with date range, department, product/fabric type, machine, shift, customer, and batch filters where relevant. Include:

- Planned versus actual production, output trend, and estimated completion date.
- Inventory on hand, consumption rate, projected stockout date, and reorder alerts.
- First-pass quality rate, defect counts, rejection percentage, and defect trends.
- Machine utilization, downtime, maintenance history, and downtime trend.
- Attendance summaries and staffing coverage by shift; do not use these metrics to make unsupported judgments about individual employees.
- Order demand, on-time delivery, revenue, cost per unit, wastage cost, and gross margin.
- Forecast charts with historical actuals, forecast horizon, prediction interval where available, model version, and last-updated timestamp.

Every chart should define its metric, unit, time period, filters, and data freshness. Allow authorized users to export reports to CSV or PDF. Do not expose payroll, personal attendance details, customer pricing, or other restricted data to roles that do not have permission.

### 37.3 Candidate prediction use cases

| Use case | Inputs needed | Initial method | Evaluation |
|---|---|---|---|
| Production forecast | Dated output, product, machine/line, shift, downtime, planned hours | Moving average or seasonal-naive baseline, then regression/time-series model | MAE and WAPE; compare with baseline |
| Order demand forecast | Historical orders, shipped quantities, product, customer where permitted, seasonality | Seasonal-naive baseline, then a time-series model | MAE/WAPE by product and forecast horizon |
| Inventory stockout | Opening stock, receipts, issues/consumption, reservations, lead times, open purchase orders | Consumption-rate estimate first; probabilistic lead-time model when data supports it | Stockout warning precision/recall and service level |
| Reorder quantity | Demand forecast, supplier lead time, minimum order quantity, safety-stock policy | Deterministic reorder-point calculation first | Stockout rate, excess stock, inventory holding cost |
| Quality/defect risk | Batch and inspection history, fabric/specification, machine, process settings, supplier/material lots | Logistic regression or tree-based classifier after sufficient labeled records | Precision, recall, PR-AUC, calibration; cost of false negatives |
| Delay risk / completion estimate | Order due date, routing steps, planned/actual progress, queue, machine capacity, downtime | Rule-based baseline, then regression/classification | MAE for completion time; precision/recall for late-order risk |
| Machine downtime risk | Maintenance logs, failure timestamps, runtime, sensor readings if installed | Rules and anomaly detection first; supervised model only with labeled failures | Alert precision, recall, lead time, false-alert rate |
| Cost and margin analysis | Material issues, labor allocation, energy/overhead allocation, production quantity, sales and returns | Deterministic costing and variance analysis first | Reconciliation to finance-approved totals |

Do not promise accurate prediction before checking data quality, historical coverage, process stability, and the number of labeled examples. If the dataset is insufficient, display descriptive analytics and transparent rules-based estimates rather than presenting an unvalidated model as AI.

### 37.4 Recommended phased rollout

```mermaid
flowchart LR
    A["Phase A<br/>Trusted analytics"] --> B["Phase B<br/>Baseline forecasts"]
    B --> C["Phase C<br/>Operational risk models<br/>shadow mode first"]
    C --> D["Phase D<br/>Monitored recommendations"]
```

**Phase A — Trusted analytics (first release)**

- Define the metric dictionary and business-approved formulas.
- Build daily and monthly summaries from validated ERP records.
- Add production, inventory, quality, delivery, and financial trend dashboards.
- Reconcile totals against source transactions and approved reports.
- Add filters, exports, access controls, and data freshness indicators.

**Phase B — Baseline forecasts**

- Start with production and demand forecasting, because their historical quantities can often be measured consistently.
- Implement simple baselines such as last-period value, moving average, and seasonal-naive forecasts.
- Use chronological train/validation/test splits; never randomly mix future observations into training data.
- Compare model results against the baseline and document forecast horizon and error metrics.
- Show forecasts as estimates with uncertainty where supported, not guaranteed outcomes.

**Phase C — Operational risk models**

- Add batch defect risk and delivery-delay risk only after outcome labels and relevant process data are reliable.
- Investigate downtime prediction after maintenance/failure records are sufficiently complete; add IoT sensor data only if hardware and sampling quality are confirmed.
- Display the main contributing factors carefully; use explainability techniques where appropriate and avoid claiming that correlations prove causes.
- Run in shadow mode first, compare predictions with real outcomes, and obtain factory-user feedback.

**Phase D — Monitored recommendations**

- Generate proposed actions such as "review this batch," "check supplier lead time," or "inspect this machine."
- Include the reason, affected batch/order/item, expected benefit, uncertainty, and relevant data timestamp.
- Require an authorized person to accept, reject, or defer recommendations.
- Record the decision and eventual outcome so the system can be evaluated.

```mermaid
flowchart TD
    R["Model proposes action<br/>reason, evidence, uncertainty, data timestamp"] --> H{"Authorized person reviews"}
    H -->|Accept| AC["Action goes through existing validated ERP APIs"]
    H -->|Reject| RJ["Decision recorded"]
    H -->|Defer| DF["Decision recorded"]
    AC --> OUT["Outcome recorded for evaluation"]
    RJ --> OUT
    DF --> OUT
    OUT --> MON["Model monitoring and rollback if needed"]
```

### 37.5 Suggested architecture

Keep the core ERP transactional workflow independent from ML services:

1. React dashboard requests a permitted report or forecast.
2. Node.js/Express checks authentication, role permissions, parameters, and rate limits.
3. PostgreSQL remains the source of truth for ERP transactions and approved aggregates.
4. A scheduled job creates validated, versioned feature datasets and summary tables.
5. A Python analytics service (Pandas and scikit-learn initially; FastAPI if a separate HTTP service is needed) produces forecasts or risk scores.
6. Store prediction records, model/version metadata, forecast horizon, creation time, and relevant evaluation metadata.
7. The UI presents results and links back to the source records the viewer is authorized to access.

Do not allow the model service to write inventory movements, attendance, payroll, purchase orders, or production transactions directly. Consequential ERP changes must go through existing validated business APIs and approval workflows.

```mermaid
flowchart TD
    UI["React dashboard"] --> EX["Node.js / Express<br/>auth, roles, validation, rate limits"]
    EX --> PG[("PostgreSQL<br/>source of truth + approved aggregates")]
    JOB["Scheduled job"] -->|versioned feature datasets + summaries| PG
    PG --> ML["Python analytics service<br/>Pandas, scikit-learn, optional FastAPI"]
    ML -->|prediction records + model version metadata| PG
    PG --> EX
    EX --> UI
    ML -. "no direct writes to inventory, attendance, payroll, POs, production" .-x PG
    ML -. "timeout / unavailable" .-> FB["Clear unavailable state - core ERP keeps running"]
```

### 37.6 Proposed API endpoints

These are design proposals and should be aligned with the actual application routes before implementation:

- `GET /api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/analytics/production?from=...&to=...&machineId=...`
- `GET /api/analytics/quality?from=...&to=...&fabricType=...`
- `GET /api/analytics/inventory?from=...&to=...&itemId=...`
- `GET /api/analytics/finance?from=...&to=...`
- `GET /api/predictions/production?days=7&machineId=...`
- `GET /api/predictions/demand?days=30&productId=...`
- `GET /api/predictions/stockout?itemId=...`
- `GET /api/predictions/quality-risk?batchId=...`
- `GET /api/predictions/delay-risk?orderId=...`
- `GET /api/predictions/status` (service health, model availability, and last successful run; no sensitive model internals)
- `GET /api/analytics/exports/:reportId` (authorized, audited export flow)

Use pagination for detailed records, validate date ranges and filter identifiers, parameterize database queries, and return consistent error objects. Avoid endpoints that let clients choose arbitrary SQL, filesystem paths, or unrestricted model artifacts.

### 37.7 Suggested data entities

Design only after inspecting the actual schema. Possible additions include:

- `analytics_metric_definitions`: metric name, definition, unit, aggregation, owner, and version.
- `analytics_daily_summaries`: date, permitted dimensions, metric values, and refresh timestamp.
- `prediction_runs`: use case, model version, input window, forecast horizon, status, and timestamps.
- `prediction_results`: prediction run, target entity, predicted value or risk score, interval if available, and output metadata.
- `model_registry`: model name/version, training-data window, validation metrics, artifact location, approval status, and deployment status.
- `recommendation_events`: recommendation, evidence summary, proposed action, reviewer decision, and outcome.
- `model_monitoring_metrics`: observed drift indicators, error metrics, sample counts, and alert status.

Do not store unnecessary personal data or duplicate all raw ERP records into the prediction tables. Use stable IDs, retention policies, access controls, and traceability to source transactions.

### 37.8 Data quality and model governance

- Validate required fields, units, timestamps, duplicate records, impossible values, and status transitions before training or forecasting.
- Define whether output is measured in meters, kilograms, pieces, rolls, or another unit; never combine unlike units in one metric.
- Preserve the time at which a fact became available to avoid training-data leakage.
- Split time-dependent data chronologically and evaluate by relevant products, machines, and forecast horizons.
- Record baseline and model metrics, sample counts, training-data window, model version, and last successful evaluation.
- Monitor missingness, feature drift, forecast error, and changes in factory processes.
- Support rollback to a previous approved model and a non-ML fallback.
- Mark unavailable or stale predictions clearly. Never silently display an old forecast as current.
- Show that a risk score is an estimate, not proof of fault or a guaranteed outcome.
- Do not use prediction alone for employee discipline, pay, attendance penalties, safety decisions, or other high-impact decisions.

### 37.9 Security and reliability

- Apply the existing role-based access policy to dashboards, exports, model inputs, and results.
- Mask or aggregate commercially sensitive information for unauthorized roles.
- Validate every input and limit forecast horizons and request frequency.
- Keep secrets and model credentials in environment configuration or a secret manager; never commit them to source control.
- Log access and important recommendation decisions without writing secrets or unnecessary personal data to logs.
- Set timeouts and bounded retries for the prediction service; provide a clear unavailable state and continue normal ERP operations when ML is down.
- Back up prediction metadata and analytics definitions alongside the relevant application data, following the approved backup policy.

### 37.10 Acceptance criteria

- [ ] Dashboard metrics reconcile with approved ERP records for the selected date range.
- [ ] Every chart displays units, filters, date range, and data freshness.
- [ ] Every forecast displays its target, horizon, model/version, and generation time.
- [ ] Model performance is compared with a documented baseline on a chronological holdout set.
- [ ] Prediction errors and uncertainty are communicated honestly; unsupported forecasts are not shown as reliable facts.
- [ ] Role restrictions apply consistently to API responses, charts, drill-downs, and exports.
- [ ] Missing/stale data and prediction-service failure are handled explicitly.
- [ ] Recommendations require human review before changing consequential business records.
- [ ] A model can be disabled or rolled back without interrupting core ERP operations.
- [ ] Tests cover formulas, permissions, invalid inputs, stale forecasts, failure fallbacks, and audit records.

### 37.11 Scope decisions to confirm

Before committing to model development, confirm: which textile processes are in scope (spinning, weaving, dyeing, finishing, garmenting, or only the processes used at the factory); which historical data exists and for how long; whether data is available per shift, machine, batch, and product; which units are used; how quality failures and machine failures are labeled; whether sensor data exists; who can view financial data; and whether predictions run on a schedule or on demand.

**Recommended starting point:** build trusted production, quality, inventory, and financial analytics first; then pilot production/demand forecasting with simple baselines. Add defect, downtime, and delay models only when their training data and evaluation criteria are ready.
