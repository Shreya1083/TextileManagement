import { prisma } from '../config/database.js';

// ============================================
// EXPENSES
// ============================================

export const createExpense = async (expenseData) => {
  return await prisma.expense.create({
    data: expenseData,
  });
};

export const getAllExpenses = async (filters = {}) => {
  const { category, startDate, endDate, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (category) where.category = category;
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate);
    if (endDate) where.expenseDate.lte = new Date(endDate);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { expenseDate: 'desc' },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getExpenseById = async (id) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  return expense;
};

export const updateExpense = async (id, updateData) => {
  return await prisma.expense.update({
    where: { id },
    data: updateData,
  });
};

export const deleteExpense = async (id) => {
  await prisma.expense.delete({ where: { id } });
  return { message: 'Expense deleted successfully' };
};

// Get expense summary by category
export const getExpenseSummary = async (filters = {}) => {
  const { startDate, endDate } = filters;

  const where = {};
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate);
    if (endDate) where.expenseDate.lte = new Date(endDate);
  }

  const expenses = await prisma.expense.findMany({
    where,
  });

  // Group by category
  const summary = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {
        category: expense.category,
        totalAmount: 0,
        count: 0,
      };
    }
    acc[expense.category].totalAmount += expense.amount;
    acc[expense.category].count += 1;
    return acc;
  }, {});

  return Object.values(summary);
};

// ============================================
// ORDER COSTING
// ============================================

export const calculateOrderCost = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true } },
      fabricType: true,
      fabricRolls: {
        include: {
          inspections: true,
        },
      },
      invoices: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Calculate material cost (yarn used)
  const yarnRequired = order.quantity * order.fabricType.yarnPerMetre;
  // Simplified: average yarn cost - in real system would track actual yarn issued
  const averageYarnPrice = 50; // ₹50 per kg (example)
  const materialCost = (yarnRequired / 1000) * averageYarnPrice * 100; // in paise

  // Calculate labor cost from production logs
  const productionLogs = await prisma.productionLog.findMany({
    where: { orderId },
  });
  
  const totalOutput = productionLogs.reduce((sum, log) => sum + log.outputQuantity, 0);
  const laborCostPerMetre = 10 * 100; // ₹10 per metre (example) in paise
  const laborCost = totalOutput * laborCostPerMetre;

  // Calculate overhead (power, maintenance, etc.)
  const overheadPerMetre = 5 * 100; // ₹5 per metre (example) in paise
  const overheadCost = order.quantity * overheadPerMetre;

  // Calculate waste/rework cost
  const totalWaste = productionLogs.reduce((sum, log) => sum + log.wasteQuantity, 0);
  const wasteCost = (totalWaste / 1000) * averageYarnPrice * 100; // in paise

  // Calculate dyeing/chemicals cost (if applicable)
  const dyeingCost = 0; // Would be tracked from actual consumption

  // Total cost
  const totalCost = materialCost + laborCost + overheadCost + wasteCost + dyeingCost;

  // Count good rolls
  const goodRolls = order.fabricRolls.filter(
    (roll) => ['PASSED', 'FINISHED_STOCK', 'DISPATCHED'].includes(roll.status)
  ).length;

  const costPerGoodRoll = goodRolls > 0 ? totalCost / goodRolls : 0;

  // Calculate revenue
  const totalRevenue = order.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Calculate profit
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

  return {
    order: {
      orderNumber: order.orderNumber,
      buyer: order.buyer.name,
      quantity: order.quantity,
    },
    costing: {
      materialCost,
      laborCost,
      overheadCost,
      wasteCost,
      dyeingCost,
      totalCost,
    },
    production: {
      totalOutput,
      totalWaste,
      goodRolls,
      costPerGoodRoll: Math.round(costPerGoodRoll),
    },
    financial: {
      totalRevenue,
      totalCost,
      profit,
      profitMargin: parseFloat(profitMargin),
    },
  };
};

// ============================================
// MACHINE OUTPUT REPORT
// ============================================

export const getMachineOutputReport = async (filters = {}) => {
  const { startDate, endDate, machineId } = filters;

  const where = {};
  if (machineId) where.machineId = machineId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const productionLogs = await prisma.productionLog.findMany({
    where,
    include: {
      machine: { select: { name: true, stage: true } },
    },
  });

  // Group by machine
  const machineOutput = productionLogs.reduce((acc, log) => {
    const key = log.machineId;
    if (!acc[key]) {
      acc[key] = {
        machine: log.machine,
        totalOutput: 0,
        totalWaste: 0,
        totalLogs: 0,
        efficiency: 0,
      };
    }
    acc[key].totalOutput += log.outputQuantity;
    acc[key].totalWaste += log.wasteQuantity;
    acc[key].totalLogs += 1;
    return acc;
  }, {});

  // Calculate efficiency
  const report = Object.values(machineOutput).map((m) => ({
    ...m,
    efficiency: m.totalOutput > 0 
      ? ((m.totalOutput / (m.totalOutput + m.totalWaste)) * 100).toFixed(2)
      : 0,
  }));

  // Sort by total output descending
  report.sort((a, b) => b.totalOutput - a.totalOutput);

  return report;
};

// ============================================
// MONTHLY P&L
// ============================================

export const getMonthlyPnL = async (month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Calculate Revenue (from paid/partially paid invoices)
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  // Calculate Material Cost (from gate entries)
  const gateEntries = await prisma.gateEntry.findMany({
    where: {
      receivedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      yarnType: true,
    },
  });

  // Simplified material cost calculation
  const materialCost = gateEntries.reduce((sum, entry) => {
    return sum + (entry.quantity * 50 * 100); // ₹50/kg estimate, in paise
  }, 0);

  // Calculate Labor Cost (from wage records)
  const wageRecords = await prisma.wageRecord.findMany({
    where: {
      month,
      year,
    },
  });

  const laborCost = wageRecords.reduce((sum, record) => sum + record.grossWage, 0);

  // Calculate Overhead Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      expenseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = 0;
    }
    acc[exp.category] += exp.amount;
    return acc;
  }, {});

  // Calculate Total Cost
  const totalCost = materialCost + laborCost + totalExpenses;

  // Calculate Profit
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0;

  return {
    period: {
      month,
      year,
      startDate,
      endDate,
    },
    revenue: {
      totalRevenue,
      invoiceCount: invoices.length,
    },
    costs: {
      materialCost,
      laborCost,
      overheadExpenses: totalExpenses,
      totalCost,
    },
    expenseBreakdown: expensesByCategory,
    profit: {
      grossProfit,
      profitMargin: parseFloat(profitMargin),
    },
  };
};

// ============================================
// OWNER DASHBOARD  (GET /api/finance/dashboard/owner?from=YYYY-MM-DD&to=YYYY-MM-DD)
// Returns all values in integer paise; display layer converts to rupees.
// ============================================

export const getOwnerDashboard = async ({ from, to } = {}) => {
  // ── Resolve date range (default = current calendar month) ──────────────────
  const now   = new Date();
  const start = from
    ? new Date(from + 'T00:00:00.000Z')
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end   = to
    ? new Date(to   + 'T23:59:59.999Z')
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  // Re-check in service layer: from <= to, max 366 days (defence-in-depth)
  if (start > end) {
    const err = new Error('from must be on or before to'); err.status = 400; throw err;
  }
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    const err = new Error('Date range must not exceed 366 days'); err.status = 400; throw err;
  }

  // ── 1. Revenue, paid amount, outstanding receivables ─────────────────────
  const invoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: start, lte: end } },
    select: {
      totalAmount: true,
      paidAmount:  true,
      status:      true,
      dueDate:     true,
    },
  });

  const revenue       = invoices.reduce((s, i) => s + i.totalAmount,                    0);
  const totalPaid     = invoices.reduce((s, i) => s + i.paidAmount,                     0);
  const receivables   = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount),   0);
  const overdueAmount = invoices
    .filter(i => ['PENDING', 'PARTIALLY_PAID'].includes(i.status) && i.dueDate && new Date(i.dueDate) < now)
    .reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);

  // ── 2. Total cost = wages + overhead expenses in range ────────────────────
  const wageMonth  = start.getUTCMonth() + 1;
  const wageYear   = start.getUTCFullYear();

  // Wages: use month/year fields on WageRecord
  const wageRecords = await prisma.wageRecord.findMany({
    where: { month: wageMonth, year: wageYear },
    select: { netWage: true },
  });
  const wagesPaid = wageRecords.reduce((s, w) => s + w.netWage, 0);

  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: start, lte: end } },
    select: { amount: true },
  });
  const overheadExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const totalCost = wagesPaid + overheadExpenses;
  const profit    = revenue - totalCost;

  // ── 3. Low-stock count ────────────────────────────────────────────────────
  const stockBatches = await prisma.stockBatch.findMany({
    select: {
      currentQuantity:  true,
      reservedQuantity: true,
      yarnType: { select: { reorderLevel: true } },
    },
  });
  const lowStockCount = stockBatches.filter(b => {
    const available = b.currentQuantity - b.reservedQuantity;
    return available < b.yarnType.reorderLevel;
  }).length;

  // ── 4. Active orders count ────────────────────────────────────────────────
  const activeOrdersCount = await prisma.order.count({
    where: { status: { in: ['IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP'] } },
  });

  // ── 5. Delayed orders (past deadline, not closed/dispatched) — cap 10 ─────
  const delayedRaw = await prisma.order.findMany({
    where: {
      deadline: { lt: now },
      status:   { notIn: ['DISPATCHED', 'CLOSED'] },
    },
    select: {
      id:          true,
      orderNumber: true,
      deadline:    true,
      status:      true,
      buyer:       { select: { name: true } },
    },
    orderBy: { deadline: 'asc' },
    take: 10,
  });

  const delayedOrders = delayedRaw.map(o => ({
    id:          o.id,
    orderNumber: o.orderNumber,
    buyer:       o.buyer.name,
    deadline:    o.deadline.toISOString(),
    status:      o.status,
    daysLate:    Math.floor((now - new Date(o.deadline)) / (1000 * 60 * 60 * 24)),
  }));

  const delayedOrdersCount = await prisma.order.count({
    where: {
      deadline: { lt: now },
      status:   { notIn: ['DISPATCHED', 'CLOSED'] },
    },
  });

  // ── 6. Machine status counts ──────────────────────────────────────────────
  const machines = await prisma.machine.findMany({
    select: { status: true },
  });
  const machineStats = {
    total:     machines.length,
    running:   machines.filter(m => m.status === 'RUNNING').length,
    idle:      machines.filter(m => m.status === 'IDLE').length,
    breakdown: machines.filter(m => m.status === 'BREAKDOWN').length,
    maintenance: machines.filter(m => m.status === 'MAINTENANCE').length,
  };

  // ── 7. Machine output ranking (top 10, sorted desc) ───────────────────────
  const machineOutputRaw = await prisma.productionLog.groupBy({
    by:      ['machineId'],
    where:   { date: { gte: start, lte: end } },
    _sum:    { outputQuantity: true },
    orderBy: { _sum: { outputQuantity: 'desc' } },
    take:    10,
  });

  const machineIds = machineOutputRaw.map(m => m.machineId);
  const machineDetails = await prisma.machine.findMany({
    where:  { id: { in: machineIds } },
    select: { id: true, name: true, machineCode: true, stage: true },
  });

  const machineOutputRanking = machineOutputRaw.map((m, idx) => {
    const mach = machineDetails.find(d => d.id === m.machineId);
    return {
      rank:        idx + 1,
      machineId:   m.machineId,
      machineName: mach?.name       ?? 'Unknown',
      machineCode: mach?.machineCode ?? '',
      stage:       mach?.stage      ?? '',
      totalMetres: m._sum.outputQuantity ?? 0,
    };
  });

  // ── 8. Production trend — daily output for the date range ─────────────────
  const productionLogs = await prisma.productionLog.findMany({
    where:  { date: { gte: start, lte: end } },
    select: { date: true, outputQuantity: true },
    orderBy: { date: 'asc' },
  });

  // Aggregate by date (ISO date string YYYY-MM-DD)
  const trendMap = new Map();
  for (const log of productionLogs) {
    const key = log.date.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + log.outputQuantity);
  }
  const productionTrend = Array.from(trendMap.entries()).map(([date, metres]) => ({
    date,
    metres,
  }));

  // ── 9. Quality metrics (rolls in range by production date) ────────────────
  const rolls = await prisma.fabricRoll.findMany({
    where:  { productionDate: { gte: start, lte: end } },
    select: { status: true },
  });

  const totalRolls   = rolls.length;
  const passedRolls  = rolls.filter(r => ['PASSED','FINISHED_STOCK','DISPATCHED'].includes(r.status)).length;
  const reworkRolls  = rolls.filter(r => r.status === 'REWORK').length;
  const rejectedRolls= rolls.filter(r => r.status === 'REJECTED').length;
  const passRate     = totalRolls > 0 ? Math.round((passedRolls / totalRolls) * 1000) / 10 : 0;

  // ── 10. QC pending ────────────────────────────────────────────────────────
  const qcPending = await prisma.fabricRoll.count({ where: { status: 'AWAITING_QC' } });

  // ── Assemble response ─────────────────────────────────────────────────────
  return {
    period: {
      from:  start.toISOString().slice(0, 10),
      to:    end.toISOString().slice(0, 10),
    },
    kpis: {
      // All money values are integer paise — display layer converts to ₹
      revenue,
      totalCost,
      profit,
      wagesPaid,
      overheadExpenses,
      receivables,
      overdueAmount,
      activeOrdersCount,
      delayedOrdersCount,
      lowStockCount,
      qcPending,
    },
    quality: {
      totalRolls,
      passedRolls,
      reworkRolls,
      rejectedRolls,
      passRate,        // e.g. 94.2 (percent)
    },
    machines: machineStats,
    machineOutputRanking,
    productionTrend,
    delayedOrders,
    generatedAt: new Date().toISOString(),
  };
};
