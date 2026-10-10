// ─── Mock data for development / demo ──────────────────────────────────────

export const mockUser = {
  id: 1,
  name: 'Rajesh Sharma',
  email: 'owner@everesttextile.com',
  role: 'owner',
  avatar: null,
}

export const mockStats = {
  revenue:       { value: 18_42_500, change: +12.4 },
  orders:        { value: 34,        change: +5     },
  production:    { value: 8_240,     change: +3.2   },  // metres today
  quality:       { value: 94.2,      change: +1.1   },  // pass %
  machines:      { active: 8, idle: 2, breakdown: 1, total: 11 },
  lowStock:      { count: 3 },
  delayedOrders: { count: 2 },
  receivables:   { value: 4_32_000  },
  wagesPaid:     { value: 3_18_000  },
}

export const mockRevenueData = [
  { month: 'Apr', revenue: 1420000, cost: 980000 },
  { month: 'May', revenue: 1680000, cost: 1100000 },
  { month: 'Jun', revenue: 1520000, cost: 1050000 },
  { month: 'Jul', revenue: 1890000, cost: 1250000 },
  { month: 'Aug', revenue: 2100000, cost: 1380000 },
  { month: 'Sep', revenue: 1842500, cost: 1210000 },
]

export const mockProductionData = [
  { day: 'Mon', output: 1240, target: 1400 },
  { day: 'Tue', output: 1380, target: 1400 },
  { day: 'Wed', output: 1290, target: 1400 },
  { day: 'Thu', output: 1460, target: 1400 },
  { day: 'Fri', output: 1510, target: 1400 },
  { day: 'Sat', output: 1120, target: 1400 },
]

export const mockQualityData = [
  { name: 'Passed',   value: 847, color: '#10b981' },
  { name: 'Rework',   value: 62,  color: '#f59e0b' },
  { name: 'Rejected', value: 31,  color: '#ef4444' },
]

export const mockMachines = [
  { id: 'M-01', name: 'Spinner A1',   stage: 'Spinning', status: 'RUNNING',   order: 'ORD-2024', operator: 'Mohan K.',  output: 320 },
  { id: 'M-02', name: 'Spinner A2',   stage: 'Spinning', status: 'RUNNING',   order: 'ORD-2025', operator: 'Suresh P.', output: 290 },
  { id: 'M-03', name: 'Weaver B1',    stage: 'Weaving',  status: 'RUNNING',   order: 'ORD-2023', operator: 'Anil V.',   output: 410 },
  { id: 'M-04', name: 'Weaver B2',    stage: 'Weaving',  status: 'IDLE',      order: null,        operator: null,        output: 0   },
  { id: 'M-05', name: 'Weaver B3',    stage: 'Weaving',  status: 'RUNNING',   order: 'ORD-2026', operator: 'Ravi M.',   output: 380 },
  { id: 'M-06', name: 'Dyer C1',      stage: 'Dyeing',   status: 'RUNNING',   order: 'ORD-2022', operator: 'Sanjay T.', output: 250 },
  { id: 'M-07', name: 'Dyer C2',      stage: 'Dyeing',   status: 'BREAKDOWN', order: null,        operator: null,        output: 0   },
  { id: 'M-08', name: 'Finisher D1',  stage: 'Finishing',status: 'RUNNING',   order: 'ORD-2021', operator: 'Priya R.',  output: 190 },
  { id: 'M-09', name: 'Finisher D2',  stage: 'Finishing',status: 'IDLE',      order: null,        operator: null,        output: 0   },
  { id: 'M-10', name: 'Spinner A3',   stage: 'Spinning', status: 'RUNNING',   order: 'ORD-2027', operator: 'Deepak S.', output: 270 },
  { id: 'M-11', name: 'Weaver B4',    stage: 'Weaving',  status: 'RUNNING',   order: 'ORD-2028', operator: 'Vijay N.',  output: 360 },
]

export const mockOrders = [
  { id: 'ORD-2028', buyer: 'Sharma Fabrics',   fabric: 'Cotton Voile',  colour: 'Sky Blue',  qty: 2000, status: 'IN_PRODUCTION', deadline: '2026-10-25', progress: 45 },
  { id: 'ORD-2027', buyer: 'Mehta Textiles',   fabric: 'Linen Blend',   colour: 'Cream',     qty: 1500, status: 'IN_PRODUCTION', deadline: '2026-10-20', progress: 62 },
  { id: 'ORD-2026', buyer: 'Patel Exports',    fabric: 'Silk Chiffon',  colour: 'Rose Gold', qty: 800,  status: 'QUALITY_CHECK', deadline: '2026-10-18', progress: 85 },
  { id: 'ORD-2025', buyer: 'Global Garments',  fabric: 'Denim',         colour: 'Indigo',    qty: 3500, status: 'IN_PRODUCTION', deadline: '2026-11-05', progress: 30 },
  { id: 'ORD-2024', buyer: 'Sunrise Mills',    fabric: 'Poly Cotton',   colour: 'White',     qty: 1200, status: 'READY_TO_SHIP', deadline: '2026-10-12', progress: 100 },
  { id: 'ORD-2023', buyer: 'Sharma Fabrics',   fabric: 'Cotton Poplin', colour: 'Navy',      qty: 900,  status: 'DISPATCHED',    deadline: '2026-10-08', progress: 100 },
  { id: 'ORD-2022', buyer: 'Mehta Textiles',   fabric: 'Rayon Crepe',   colour: 'Burgundy',  qty: 600,  status: 'IN_PRODUCTION', deadline: '2026-10-28', progress: 55 },
  { id: 'ORD-2021', buyer: 'Kapoor Garments',  fabric: 'Georgette',     colour: 'Peach',     qty: 1100, status: 'CONFIRMED',     deadline: '2026-11-10', progress: 10 },
]

export const mockYarnStock = [
  { id: 1, type: 'Cotton 40s',      colour: 'White',   current: 850,  reserved: 320, available: 530, reorder: 500, unit: 'kg', status: 'OK'  },
  { id: 2, type: 'Cotton 60s',      colour: 'White',   current: 420,  reserved: 380, available: 40,  reorder: 300, unit: 'kg', status: 'LOW' },
  { id: 3, type: 'Poly 150D',       colour: 'Natural', current: 1200, reserved: 200, available: 1000,reorder: 400, unit: 'kg', status: 'OK'  },
  { id: 4, type: 'Linen 20s',       colour: 'Cream',   current: 280,  reserved: 290, available: -10, reorder: 200, unit: 'kg', status: 'OUT' },
  { id: 5, type: 'Silk 2/120D',     colour: 'Natural', current: 95,   reserved: 60,  available: 35,  reorder: 100, unit: 'kg', status: 'LOW' },
  { id: 6, type: 'Denim 7oz',       colour: 'Indigo',  current: 2100, reserved: 800, available: 1300,reorder: 600, unit: 'm',  status: 'OK'  },
  { id: 7, type: 'Viscose 30s',     colour: 'White',   current: 630,  reserved: 150, available: 480, reorder: 300, unit: 'kg', status: 'OK'  },
]

export const mockRolls = [
  { id: 'EVR-2026-000189', order: 'ORD-2026', machine: 'M-05', length: 120, status: 'AWAITING_QC', produced: '2026-10-09', inspector: null    },
  { id: 'EVR-2026-000188', order: 'ORD-2026', machine: 'M-05', length: 118, status: 'AWAITING_QC', produced: '2026-10-09', inspector: null    },
  { id: 'EVR-2026-000187', order: 'ORD-2025', machine: 'M-02', length: 115, status: 'AWAITING_QC', produced: '2026-10-09', inspector: null    },
  { id: 'EVR-2026-000185', order: 'ORD-2022', machine: 'M-06', length: 110, status: 'PASSED',       produced: '2026-10-08', inspector: 'Neha S.' },
  { id: 'EVR-2026-000184', order: 'ORD-2022', machine: 'M-06', length: 122, status: 'REWORK',       produced: '2026-10-08', inspector: 'Neha S.' },
  { id: 'EVR-2026-000183', order: 'ORD-2024', machine: 'M-01', length: 125, status: 'PASSED',       produced: '2026-10-07', inspector: 'Neha S.' },
  { id: 'EVR-2026-000182', order: 'ORD-2024', machine: 'M-01', length: 108, status: 'REJECTED',     produced: '2026-10-07', inspector: 'Neha S.' },
]

export const mockWorkers = [
  { id: 'W-001', name: 'Mohan Kumar',   role: 'Spinner Operator',   dept: 'Production', wage: 650, basis: 'daily', present: 24, month: 'Sep', net: 15600 },
  { id: 'W-002', name: 'Suresh Patil',  role: 'Spinner Operator',   dept: 'Production', wage: 650, basis: 'daily', present: 26, month: 'Sep', net: 16900 },
  { id: 'W-003', name: 'Anil Verma',    role: 'Weaver',             dept: 'Production', wage: 700, basis: 'daily', present: 25, month: 'Sep', net: 17500 },
  { id: 'W-004', name: 'Neha Shah',     role: 'Quality Inspector',  dept: 'QC',         wage: 750, basis: 'daily', present: 26, month: 'Sep', net: 19500 },
  { id: 'W-005', name: 'Priya Rao',     role: 'Finisher',           dept: 'Production', wage: 620, basis: 'daily', present: 22, month: 'Sep', net: 13640 },
  { id: 'W-006', name: 'Ravi Mehta',    role: 'Weaver',             dept: 'Production', wage: 700, basis: 'daily', present: 27, month: 'Sep', net: 18900 },
  { id: 'W-007', name: 'Sanjay Tiwari', role: 'Dyer',               dept: 'Production', wage: 680, basis: 'daily', present: 23, month: 'Sep', net: 15640 },
  { id: 'W-008', name: 'Deepak Singh',  role: 'Store Keeper',       dept: 'Store',      wage: 720, basis: 'daily', present: 26, month: 'Sep', net: 18720 },
]

export const mockSuppliers = [
  { id: 'S-01', name: 'Agarwal Yarns Pvt Ltd',   city: 'Surat',    contact: '+91 98765 43210', gstin: '24AABCA1234B1Z5', activePos: 2 },
  { id: 'S-02', name: 'Krishna Fibers',           city: 'Bhiwandi', contact: '+91 97654 32109', gstin: '27AABCK5678C1Z3', activePos: 1 },
  { id: 'S-03', name: 'Bharat Silk House',        city: 'Varanasi', contact: '+91 96543 21098', gstin: '09AABCB9012D1Z1', activePos: 0 },
  { id: 'S-04', name: 'Rajasthan Denim Supply',   city: 'Jodhpur',  contact: '+91 95432 10987', gstin: '08AABCR3456E1Z9', activePos: 1 },
]

export const mockAlerts = [
  { id: 1, type: 'low-stock',  message: 'Cotton 60s below reorder level (40 kg available)',  time: '15 min ago', severity: 'warning' },
  { id: 2, type: 'breakdown',  message: 'Machine M-07 (Dyer C2) reported breakdown',         time: '1 hr ago',  severity: 'danger'  },
  { id: 3, type: 'deadline',   message: 'ORD-2024 deadline is today — still in production',  time: '2 hr ago',  severity: 'danger'  },
  { id: 4, type: 'low-stock',  message: 'Silk 2/120D below reorder level (35 kg available)', time: '3 hr ago',  severity: 'warning' },
  { id: 5, type: 'payment',    message: 'Invoice INV-1042 overdue — Sharma Fabrics',         time: '1 day ago', severity: 'warning' },
]

export const mockDefectReport = [
  { type: 'Colour Mismatch', count: 28, pct: 30.4 },
  { type: 'Uneven Weave',    count: 22, pct: 23.9 },
  { type: 'Stain',           count: 18, pct: 19.6 },
  { type: 'Hole',            count: 14, pct: 15.2 },
  { type: 'Other',           count: 10, pct: 10.9 },
]

export const mockDispatches = [
  { id: 'DSP-0088', buyer: 'Patel Exports',   order: 'ORD-2023', rolls: 4, metres: 458, date: '2026-10-08', status: 'INVOICED',  vehicle: 'GJ05AB1234' },
  { id: 'DSP-0087', buyer: 'Sharma Fabrics',  order: 'ORD-2021', rolls: 6, metres: 690, date: '2026-10-07', status: 'INVOICED',  vehicle: 'MH02CD5678' },
  { id: 'DSP-0086', buyer: 'Sunrise Mills',   order: 'ORD-2019', rolls: 3, metres: 340, date: '2026-10-05', status: 'INVOICED',  vehicle: 'RJ14EF9012' },
]

export const mockInvoices = [
  { id: 'INV-1045', buyer: 'Patel Exports',  dispatch: 'DSP-0088', amount: 1_14_500, paid: 1_14_500, balance: 0,       status: 'PAID',     date: '2026-10-08' },
  { id: 'INV-1044', buyer: 'Sharma Fabrics', dispatch: 'DSP-0087', amount: 2_07_000, paid: 1_00_000, balance: 1_07_000, status: 'PARTIAL',  date: '2026-10-07' },
  { id: 'INV-1043', buyer: 'Sunrise Mills',  dispatch: 'DSP-0086', amount: 85_000,   paid: 0,        balance: 85_000,  status: 'UNPAID',   date: '2026-10-05' },
  { id: 'INV-1042', buyer: 'Sharma Fabrics', dispatch: 'DSP-0082', amount: 1_68_000, paid: 0,        balance: 1_68_000, status: 'OVERDUE',  date: '2026-09-20' },
]

// ─── End-of-Day / Daily Summary Data ────────────────────────────────────────

export const mockDailyShifts = [
  {
    shift: 'Morning',   time: '06:00 – 14:00',
    workers: 18, present: 17, absent: 1,
    output: 3120, target: 3200, waste: 48,
    rollsProduced: 14, rollsPassed: 12, rollsRework: 1, rollsRejected: 1,
    machinesRunning: 8, machinesIdle: 2, machinesBreakdown: 1,
  },
  {
    shift: 'Afternoon', time: '14:00 – 22:00',
    workers: 16, present: 15, absent: 1,
    output: 2940, target: 3000, waste: 36,
    rollsProduced: 13, rollsPassed: 12, rollsRework: 1, rollsRejected: 0,
    machinesRunning: 7, machinesIdle: 3, machinesBreakdown: 1,
  },
  {
    shift: 'Night',     time: '22:00 – 06:00',
    workers: 12, present: 12, absent: 0,
    output: 2180, target: 2400, waste: 29,
    rollsProduced: 9,  rollsPassed: 8,  rollsRework: 1, rollsRejected: 0,
    machinesRunning: 6, machinesIdle: 4, machinesBreakdown: 1,
  },
]

export const mockDailySummary = {
  date: '2026-10-10',
  // Production
  totalOutput:      8240,    // metres
  totalTarget:      8600,
  totalWaste:       113,
  achievementPct:   95.8,
  rollsProduced:    36,
  rollsPassed:      32,
  rollsRework:      3,
  rollsRejected:    1,
  // Quality
  passRate:         88.9,
  defectsFound:     12,
  topDefect:        'Colour Mismatch',
  // Workforce
  totalWorkers:     46,
  totalPresent:     44,
  totalAbsent:      2,
  attendancePct:    95.7,
  overtimeHrs:      14,
  // Machines
  machineUptime:    78.8,    // %
  downtimeEvents:   1,
  downtimeMachine:  'M-07 (Dyer C2)',
  downtimeMins:     340,
  // Inventory
  yarnConsumed:     { Cotton40s: 210, Poly150D: 165, DyeingChemicals: 38 }, // kg
  stockWarnings:    3,
  // Finance
  estimatedRevenue: 2_06_000,  // based on output × avg rate
  estimatedCost:    1_41_500,
  estimatedProfit:  64_500,
  // Dispatches
  dispatchesToday:  1,
  metresDispatched: 458,
  invoicesRaised:   1,
  invoiceValue:     1_14_500,
}

export const mockHourlyOutput = [
  { hour: '06', output: 420, target: 450 },
  { hour: '07', output: 465, target: 450 },
  { hour: '08', output: 490, target: 450 },
  { hour: '09', output: 440, target: 450 },
  { hour: '10', output: 510, target: 450 },
  { hour: '11', output: 485, target: 450 },
  { hour: '12', output: 430, target: 450 },
  { hour: '13', output: 395, target: 450 },  // lunch dip
  { hour: '14', output: 455, target: 450 },
  { hour: '15', output: 470, target: 450 },
  { hour: '16', output: 480, target: 450 },
  { hour: '17', output: 420, target: 450 },
  { hour: '18', output: 390, target: 450 },
  { hour: '19', output: 350, target: 450 },  // breakdown window
  { hour: '20', output: 360, target: 450 },
  { hour: '21', output: 370, target: 450 },
  { hour: '22', output: 315, target: 380 },
  { hour: '23', output: 290, target: 380 },
]

export const mockMachineOutput = [
  { machine: 'M-01', name: 'Spinner A1',  output: 320, target: 350, status: 'RUNNING',   eff: 91.4 },
  { machine: 'M-02', name: 'Spinner A2',  output: 290, target: 350, status: 'RUNNING',   eff: 82.9 },
  { machine: 'M-03', name: 'Weaver B1',   output: 410, target: 400, status: 'RUNNING',   eff: 102.5 },
  { machine: 'M-04', name: 'Weaver B2',   output: 0,   target: 400, status: 'IDLE',      eff: 0 },
  { machine: 'M-05', name: 'Weaver B3',   output: 380, target: 400, status: 'RUNNING',   eff: 95.0 },
  { machine: 'M-06', name: 'Dyer C1',     output: 250, target: 280, status: 'RUNNING',   eff: 89.3 },
  { machine: 'M-07', name: 'Dyer C2',     output: 0,   target: 280, status: 'BREAKDOWN', eff: 0 },
  { machine: 'M-08', name: 'Finisher D1', output: 190, target: 220, status: 'RUNNING',   eff: 86.4 },
  { machine: 'M-09', name: 'Finisher D2', output: 0,   target: 220, status: 'IDLE',      eff: 0 },
  { machine: 'M-10', name: 'Spinner A3',  output: 270, target: 350, status: 'RUNNING',   eff: 77.1 },
  { machine: 'M-11', name: 'Weaver B4',   output: 360, target: 400, status: 'RUNNING',   eff: 90.0 },
]

export const mockTopPerformers = [
  { rank: 1, name: 'Anil Verma',    role: 'Weaver',   machine: 'M-03', output: 410, badge: '🥇' },
  { rank: 2, name: 'Vijay Nair',    role: 'Weaver',   machine: 'M-11', output: 360, badge: '🥈' },
  { rank: 3, name: 'Ravi Mehta',    role: 'Weaver',   machine: 'M-05', output: 380, badge: '🥉' },
  { rank: 4, name: 'Mohan Kumar',   role: 'Spinner',  machine: 'M-01', output: 320, badge: '' },
  { rank: 5, name: 'Sanjay Tiwari', role: 'Dyer',     machine: 'M-06', output: 250, badge: '' },
]

export const mockEODTimeline = [
  { time: '06:00', event: 'Morning shift started',           type: 'info',    icon: 'shift' },
  { time: '07:15', event: 'GRN received: Poly 150D (200 kg) from Krishna Fibers', type: 'success', icon: 'stock' },
  { time: '09:42', event: 'ORD-2026 moved to Quality Check', type: 'info',    icon: 'order' },
  { time: '11:30', event: 'M-07 (Dyer C2) breakdown logged', type: 'danger',  icon: 'breakdown' },
  { time: '12:00', event: 'Cotton 60s dropped below reorder level', type: 'warning', icon: 'stock' },
  { time: '14:00', event: 'Afternoon shift started',          type: 'info',    icon: 'shift' },
  { time: '15:20', event: '12 rolls passed QC (ORD-2026)',    type: 'success', icon: 'quality' },
  { time: '16:45', event: 'Dispatch DSP-0088 confirmed — Patel Exports', type: 'success', icon: 'dispatch' },
  { time: '17:10', event: 'Invoice INV-1045 raised (₹1,14,500)', type: 'success', icon: 'invoice' },
  { time: '18:30', event: 'ORD-2024 deadline alert — still in production', type: 'danger', icon: 'order' },
  { time: '22:00', event: 'Night shift started',              type: 'info',    icon: 'shift' },
  { time: '23:55', event: 'Day closed — 8,240 m total output', type: 'info',   icon: 'close' },
]
