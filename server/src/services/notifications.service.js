import { prisma } from '../config/database.js';

/**
 * All notifications are generated on-demand from live DB data.
 * No external provider required — alerts show in-app.
 */

export const getActiveAlerts = async () => {
  const now = new Date();
  const alerts = [];

  // 1. Low-stock alerts
  const batches = await prisma.stockBatch.findMany({ include: { yarnType: true } });
  for (const b of batches) {
    const available = b.currentQuantity - b.reservedQuantity;
    if (available < b.yarnType.reorderLevel) {
      alerts.push({
        type: 'LOW_STOCK',
        severity: available <= 0 ? 'CRITICAL' : 'WARNING',
        title: `Low stock: ${b.yarnType.name}`,
        message: `Available: ${available} ${b.yarnType.unit}. Reorder level: ${b.yarnType.reorderLevel}.`,
        entityType: 'YarnType',
        entityId: b.yarnTypeId,
        createdAt: now,
      });
    }
  }

  // 2. Overdue orders
  const overdueOrders = await prisma.order.findMany({
    where: {
      deadline: { lt: now },
      status: { notIn: ['DISPATCHED', 'CLOSED', 'CANCELLED'] },
    },
    include: { buyer: { select: { name: true } } },
  });
  for (const o of overdueOrders) {
    const daysLate = Math.ceil((now - new Date(o.deadline)) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: 'ORDER_OVERDUE',
      severity: daysLate > 7 ? 'CRITICAL' : 'HIGH',
      title: `Order overdue: ${o.orderNumber}`,
      message: `Buyer: ${o.buyer.name}. ${daysLate} day(s) past deadline. Status: ${o.status}.`,
      entityType: 'Order',
      entityId: o.id,
      createdAt: now,
    });
  }

  // 3. Deadline approaching (next 3 days)
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const urgentOrders = await prisma.order.findMany({
    where: {
      deadline: { gte: now, lte: threeDaysLater },
      status: { notIn: ['DISPATCHED', 'CLOSED', 'CANCELLED'] },
    },
    include: { buyer: { select: { name: true } } },
  });
  for (const o of urgentOrders) {
    const daysLeft = Math.ceil((new Date(o.deadline) - now) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: 'DEADLINE_APPROACHING',
      severity: 'WARNING',
      title: `Deadline approaching: ${o.orderNumber}`,
      message: `Buyer: ${o.buyer.name}. ${daysLeft} day(s) remaining. Status: ${o.status}.`,
      entityType: 'Order',
      entityId: o.id,
      createdAt: now,
    });
  }

  // 4. Machine breakdowns
  const brokenMachines = await prisma.machine.findMany({
    where: { status: 'BREAKDOWN' },
  });
  for (const m of brokenMachines) {
    alerts.push({
      type: 'MACHINE_BREAKDOWN',
      severity: 'HIGH',
      title: `Machine breakdown: ${m.name}`,
      message: `Machine ${m.name} (${m.machineCode}) is currently in BREAKDOWN state.`,
      entityType: 'Machine',
      entityId: m.id,
      createdAt: now,
    });
  }

  // 5. QC backlog — rolls waiting > 24 hours
  const qcThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const qcBacklog = await prisma.fabricRoll.findMany({
    where: {
      status: 'AWAITING_QC',
      updatedAt: { lt: qcThreshold },
    },
    include: {
      order: { select: { orderNumber: true } },
    },
  });
  if (qcBacklog.length > 0) {
    alerts.push({
      type: 'QC_BACKLOG',
      severity: 'WARNING',
      title: `QC backlog: ${qcBacklog.length} roll(s) waiting`,
      message: `${qcBacklog.length} roll(s) have been awaiting quality inspection for more than 24 hours.`,
      entityType: 'FabricRoll',
      entityId: null,
      count: qcBacklog.length,
      createdAt: now,
    });
  }

  // 6. Overdue payments
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
    include: { buyer: { select: { name: true } } },
  });
  for (const inv of overdueInvoices) {
    const outstanding = inv.totalAmount - inv.paidAmount;
    alerts.push({
      type: 'PAYMENT_OVERDUE',
      severity: 'HIGH',
      title: `Payment overdue: ${inv.invoiceNumber}`,
      message: `Buyer: ${inv.buyer.name}. Outstanding: ₹${(outstanding / 100).toFixed(2)}.`,
      entityType: 'Invoice',
      entityId: inv.id,
      createdAt: now,
    });
  }

  // Sort: CRITICAL first, then HIGH, then WARNING
  const order = { CRITICAL: 0, HIGH: 1, WARNING: 2 };
  alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'CRITICAL').length,
    high:     alerts.filter(a => a.severity === 'HIGH').length,
    warning:  alerts.filter(a => a.severity === 'WARNING').length,
    alerts,
  };
};

export const getAlertsByType = async (type) => {
  const all = await getActiveAlerts();
  return all.alerts.filter(a => a.type === type);
};
