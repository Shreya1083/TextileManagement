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
// OWNER DASHBOARD
// ============================================

export const getOwnerDashboard = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // Get current month revenue
  const monthInvoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: startOfMonth },
    },
  });

  const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  // Get current month costs (simplified)
  const monthWages = await prisma.wageRecord.findMany({
    where: {
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    },
  });

  const monthLaborCost = monthWages.reduce((sum, w) => sum + w.grossWage, 0);

  const monthExpenses = await prisma.expense.findMany({
    where: {
      expenseDate: { gte: startOfMonth },
    },
  });

  const monthExpenseTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthCost = monthLaborCost + monthExpenseTotal;
  const monthProfit = monthRevenue - monthCost;

  // Get outstanding receivables
  const allInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
    },
  });

  const totalReceivables = allInvoices.reduce(
    (sum, inv) => sum + (inv.totalAmount - inv.paidAmount),
    0
  );

  // Get low stock count
  const stockBatches = await prisma.stockBatch.findMany({
    include: {
      yarnType: true,
    },
  });

  const lowStockItems = stockBatches.filter((batch) => {
    const available = batch.currentQuantity - batch.reservedQuantity;
    return available < batch.yarnType.reorderLevel;
  }).length;

  // Get delayed orders
  const delayedOrders = await prisma.order.count({
    where: {
      deadline: { lt: today },
      status: { notIn: ['DISPATCHED', 'CLOSED'] },
    },
  });

  // Get machine output ranking (top 5)
  const machineProduction = await prisma.productionLog.groupBy({
    by: ['machineId'],
    _sum: {
      outputQuantity: true,
    },
    orderBy: {
      _sum: {
        outputQuantity: 'desc',
      },
    },
    take: 5,
  });

  const machineIds = machineProduction.map((m) => m.machineId);
  const machines = await prisma.machine.findMany({
    where: {
      id: { in: machineIds },
    },
  });

  const machineOutputRanking = machineProduction.map((m) => {
    const machine = machines.find((mach) => mach.id === m.machineId);
    return {
      machineName: machine?.name || 'Unknown',
      totalOutput: m._sum.outputQuantity || 0,
    };
  });

  // Get active orders count
  const activeOrders = await prisma.order.count({
    where: {
      status: { in: ['IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP'] },
    },
  });

  // Get QC pending count
  const qcPending = await prisma.fabricRoll.count({
    where: {
      status: 'AWAITING_QC',
    },
  });

  return {
    summary: {
      monthRevenue,
      monthCost,
      monthProfit,
      totalReceivables,
      activeOrders,
      lowStockItems,
      delayedOrders,
      qcPending,
    },
    machineOutputRanking,
    recentMetrics: {
      profitMargin: monthRevenue > 0 ? ((monthProfit / monthRevenue) * 100).toFixed(2) : 0,
    },
  };
};
