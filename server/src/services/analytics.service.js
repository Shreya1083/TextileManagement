import { prisma } from '../config/database.js';

// ============================================
// ANALYTICS OVERVIEW
// ============================================

export const getOverview = async ({ from, to } = {}) => {
  const where = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }

  const [
    totalOrders, activeOrders, completedOrders,
    totalRolls, passedRolls, rejectedRolls, awaitingQC,
    totalDispatches, totalInvoices, unpaidInvoices,
    lowStockCount, machineBreakdowns,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ['IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP'] } } }),
    prisma.order.count({ where: { status: { in: ['DISPATCHED', 'CLOSED'] } } }),
    prisma.fabricRoll.count(),
    prisma.fabricRoll.count({ where: { status: { in: ['FINISHED_STOCK', 'DISPATCHED'] } } }),
    prisma.fabricRoll.count({ where: { status: 'REJECTED' } }),
    prisma.fabricRoll.count({ where: { status: 'AWAITING_QC' } }),
    prisma.dispatch.count(),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } } }),
    // Low stock: batches where available < reorderLevel
    (async () => {
      const batches = await prisma.stockBatch.findMany({ include: { yarnType: true } });
      return batches.filter(b => (b.currentQuantity - b.reservedQuantity) < b.yarnType.reorderLevel).length;
    })(),
    prisma.machine.count({ where: { status: 'BREAKDOWN' } }),
  ]);

  const passRate = totalRolls > 0
    ? +((passedRolls / totalRolls) * 100).toFixed(1) : 0;

  return {
    orders: { total: totalOrders, active: activeOrders, completed: completedOrders },
    quality: { totalRolls, passedRolls, rejectedRolls, awaitingQC, passRate },
    dispatch: { totalDispatches, totalInvoices, unpaidInvoices },
    inventory: { lowStockCount },
    machines: { breakdowns: machineBreakdowns },
  };
};

// ============================================
// PRODUCTION ANALYTICS
// ============================================

export const getProductionAnalytics = async ({ from, to, machineId } = {}) => {
  const where = {};
  if (machineId) where.machineId = machineId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to);
  }

  const logs = await prisma.productionLog.findMany({
    where,
    include: {
      machine: { select: { name: true, stage: true } },
    },
    orderBy: { date: 'asc' },
  });

  // Daily output trend
  const dailyTrend = logs.reduce((acc, log) => {
    const day = log.date.toISOString().split('T')[0];
    if (!acc[day]) acc[day] = { date: day, output: 0, waste: 0 };
    acc[day].output += log.outputQuantity;
    acc[day].waste  += log.wasteQuantity;
    return acc;
  }, {});

  // Per-machine breakdown
  const byMachine = logs.reduce((acc, log) => {
    const k = log.machineId;
    if (!acc[k]) acc[k] = { machine: log.machine, output: 0, waste: 0, entries: 0 };
    acc[k].output  += log.outputQuantity;
    acc[k].waste   += log.wasteQuantity;
    acc[k].entries += 1;
    return acc;
  }, {});

  const totalOutput = logs.reduce((s, l) => s + l.outputQuantity, 0);
  const totalWaste  = logs.reduce((s, l) => s + l.wasteQuantity, 0);
  const efficiency  = totalOutput > 0
    ? +((totalOutput / (totalOutput + totalWaste)) * 100).toFixed(1) : 0;

  return {
    summary: { totalOutput, totalWaste, efficiency, logCount: logs.length },
    dailyTrend: Object.values(dailyTrend),
    byMachine: Object.values(byMachine).sort((a, b) => b.output - a.output),
  };
};

// ============================================
// QUALITY ANALYTICS
// ============================================

export const getQualityAnalytics = async ({ from, to, fabricTypeId } = {}) => {
  const rollWhere = {};
  if (fabricTypeId) rollWhere.order = { fabricTypeId };

  const inspWhere = {};
  if (from || to) {
    inspWhere.inspectedAt = {};
    if (from) inspWhere.inspectedAt.gte = new Date(from);
    if (to)   inspWhere.inspectedAt.lte = new Date(to);
  }

  const [inspections, defects] = await Promise.all([
    prisma.inspection.findMany({
      where: inspWhere,
      include: { defects: true },
      orderBy: { inspectedAt: 'asc' },
    }),
    prisma.defect.findMany({
      where: {
        inspection: inspWhere,
      },
    }),
  ]);

  const passed   = inspections.filter(i => i.result === 'PASS').length;
  const rework   = inspections.filter(i => i.result === 'REWORK').length;
  const rejected = inspections.filter(i => i.result === 'REJECT').length;
  const total    = inspections.length;

  // Defect frequency
  const defectFreq = defects.reduce((acc, d) => {
    acc[d.defectType] = (acc[d.defectType] || 0) + d.count;
    return acc;
  }, {});

  // Weekly trend
  const weeklyTrend = inspections.reduce((acc, insp) => {
    const week = getWeekKey(insp.inspectedAt);
    if (!acc[week]) acc[week] = { week, pass: 0, rework: 0, reject: 0 };
    if (insp.result === 'PASS')   acc[week].pass++;
    if (insp.result === 'REWORK') acc[week].rework++;
    if (insp.result === 'REJECT') acc[week].reject++;
    return acc;
  }, {});

  return {
    summary: {
      total,
      passed,
      rework,
      rejected,
      firstPassRate: total > 0 ? +((passed / total) * 100).toFixed(1) : 0,
      rejectionRate: total > 0 ? +((rejected / total) * 100).toFixed(1) : 0,
    },
    defectFrequency: Object.entries(defectFreq)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    weeklyTrend: Object.values(weeklyTrend).sort((a, b) => a.week.localeCompare(b.week)),
  };
};

// ============================================
// INVENTORY ANALYTICS
// ============================================

export const getInventoryAnalytics = async ({ from, to, itemId } = {}) => {
  const moveWhere = {};
  if (itemId) moveWhere.stockBatch = { yarnTypeId: itemId };
  if (from || to) {
    moveWhere.createdAt = {};
    if (from) moveWhere.createdAt.gte = new Date(from);
    if (to)   moveWhere.createdAt.lte = new Date(to);
  }

  const [batches, movements] = await Promise.all([
    prisma.stockBatch.findMany({
      include: { yarnType: true },
    }),
    prisma.stockMovement.findMany({
      where: moveWhere,
      include: { stockBatch: { include: { yarnType: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const stockSummary = batches.map(b => ({
    yarnType: b.yarnType.name,
    current:  b.currentQuantity,
    reserved: b.reservedQuantity,
    available: b.currentQuantity - b.reservedQuantity,
    reorderLevel: b.yarnType.reorderLevel,
    isLow: (b.currentQuantity - b.reservedQuantity) < b.yarnType.reorderLevel,
  }));

  const totalIn  = movements.filter(m => m.movementType === 'IN' ).reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter(m => m.movementType === 'OUT').reduce((s, m) => s + m.quantity, 0);

  // Consumption trend (daily OUT movements)
  const consumptionTrend = movements
    .filter(m => m.movementType === 'OUT')
    .reduce((acc, m) => {
      const day = m.createdAt.toISOString().split('T')[0];
      if (!acc[day]) acc[day] = { date: day, consumed: 0 };
      acc[day].consumed += m.quantity;
      return acc;
    }, {});

  return {
    stockSummary,
    lowStockItems: stockSummary.filter(s => s.isLow),
    movements: { totalIn, totalOut, netChange: totalIn - totalOut },
    consumptionTrend: Object.values(consumptionTrend),
  };
};

// ============================================
// FINANCE ANALYTICS
// ============================================

export const getFinanceAnalytics = async ({ from, to } = {}) => {
  const dateFilter = {};
  if (from || to) {
    dateFilter.gte = from ? new Date(from) : undefined;
    dateFilter.lte = to   ? new Date(to)   : undefined;
  }

  const [invoices, payments, expenses, wageRecords] = await Promise.all([
    prisma.invoice.findMany({
      where: Object.keys(dateFilter).length ? { invoiceDate: dateFilter } : {},
      orderBy: { invoiceDate: 'asc' },
    }),
    prisma.payment.findMany({
      where: Object.keys(dateFilter).length ? { paymentDate: dateFilter } : {},
      orderBy: { paymentDate: 'asc' },
    }),
    prisma.expense.findMany({
      where: Object.keys(dateFilter).length ? { expenseDate: dateFilter } : {},
    }),
    prisma.wageRecord.findMany(),
  ]);

  const totalInvoiced  = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.paidAmount,  0);
  const outstanding    = totalInvoiced - totalCollected;

  const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
  const totalWages     = wageRecords.reduce((s, w) => s + w.grossWage, 0);

  // Monthly revenue trend
  const monthlyRevenue = invoices.reduce((acc, inv) => {
    const key = inv.invoiceDate.toISOString().substring(0, 7); // YYYY-MM
    if (!acc[key]) acc[key] = { month: key, invoiced: 0, collected: 0 };
    acc[key].invoiced   += inv.totalAmount;
    acc[key].collected  += inv.paidAmount;
    return acc;
  }, {});

  // Expense by category
  const expByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return {
    summary: {
      totalInvoiced,
      totalCollected,
      outstanding,
      totalExpenses,
      totalWages,
      netProfit: totalCollected - totalExpenses - totalWages,
    },
    monthlyRevenue: Object.values(monthlyRevenue).sort((a, b) => a.month.localeCompare(b.month)),
    expensesByCategory: Object.entries(expByCategory).map(([category, amount]) => ({ category, amount })),
  };
};

// ============================================
// DELAY RISK (rule-based)
// ============================================

export const getDelayRiskOrders = async () => {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ['DISPATCHED', 'CLOSED', 'CANCELLED'] },
    },
    include: {
      buyer: { select: { name: true } },
      fabricType: { select: { name: true } },
    },
    orderBy: { deadline: 'asc' },
  });

  return orders.map(o => {
    const daysLeft = Math.ceil((new Date(o.deadline) - now) / (1000 * 60 * 60 * 24));
    let riskLevel = 'LOW';
    if (daysLeft < 0)  riskLevel = 'OVERDUE';
    else if (daysLeft <= 3) riskLevel = 'CRITICAL';
    else if (daysLeft <= 7) riskLevel = 'HIGH';
    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      buyer: o.buyer.name,
      fabricType: o.fabricType.name,
      status: o.status,
      deadline: o.deadline,
      daysLeft,
      riskLevel,
    };
  }).filter(o => o.riskLevel !== 'LOW');
};

// ============================================
// STOCKOUT RISK (rule-based)
// ============================================

export const getStockoutRisk = async () => {
  const batches = await prisma.stockBatch.findMany({
    include: { yarnType: true },
  });

  // Average daily consumption from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const outMovements = await prisma.stockMovement.findMany({
    where: { movementType: 'OUT', createdAt: { gte: thirtyDaysAgo } },
    include: { stockBatch: { select: { yarnTypeId: true } } },
  });

  const consumptionByType = outMovements.reduce((acc, m) => {
    const key = m.stockBatch.yarnTypeId;
    acc[key] = (acc[key] || 0) + m.quantity;
    return acc;
  }, {});

  return batches.map(b => {
    const available      = b.currentQuantity - b.reservedQuantity;
    const dailyAvg       = (consumptionByType[b.yarnTypeId] || 0) / 30;
    const daysRemaining  = dailyAvg > 0 ? Math.floor(available / dailyAvg) : null;
    const isLow          = available < b.yarnType.reorderLevel;
    return {
      yarnType: b.yarnType.name,
      available,
      reorderLevel: b.yarnType.reorderLevel,
      dailyConsumption: +dailyAvg.toFixed(2),
      estimatedDaysRemaining: daysRemaining,
      riskLevel: isLow ? (available <= 0 ? 'OUT_OF_STOCK' : 'CRITICAL') : (daysRemaining !== null && daysRemaining <= 7 ? 'LOW' : 'SAFE'),
    };
  }).sort((a, b) => (a.estimatedDaysRemaining ?? 999) - (b.estimatedDaysRemaining ?? 999));
};

// Helper
function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}
