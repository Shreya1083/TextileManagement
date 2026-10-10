import { prisma } from '../config/database.js';
import { validateEntity, DispatchRules, MoneyRules } from '../utils/businessRules.js';
import { validateRollStatusTransition } from '../utils/statusLifecycles.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';

// ============================================
// FINISHED GOODS / STOCK
// ============================================

export const getFinishedStock = async (filters = {}) => {
  const { buyerId, orderId, page = 1, limit = 50 } = filters;
  
  const where = { 
    status: { in: ['FINISHED_STOCK', 'PASSED'] },
  };
  if (orderId) where.orderId = orderId;
  if (buyerId) where.order = { buyerId };

  const [rolls, total] = await Promise.all([
    prisma.fabricRoll.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
            fabricType: { select: { name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { productionDate: 'asc' },
    }),
    prisma.fabricRoll.count({ where }),
  ]);

  return { rolls, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

// ============================================
// DISPATCHES
// ============================================

export const createDispatch = async (dispatchData, userId) => {
  return await prisma.$transaction(async (tx) => {
    const { rollIds, ...mainData } = dispatchData;

    // Validate rollIds is provided and not empty
    if (!rollIds || rollIds.length === 0) {
      throw new Error('At least one roll must be selected for dispatch');
    }

    // Validate all rolls exist
    const rolls = await tx.fabricRoll.findMany({
      where: {
        id: { in: rollIds },
      },
      include: {
        order: {
          include: {
            buyer: true,
            fabricType: true,
          },
        },
        dispatchItems: true, // Check if already dispatched
      },
    });

    if (rolls.length !== rollIds.length) {
      throw new Error(`Some rolls not found. Expected ${rollIds.length}, found ${rolls.length}`);
    }

    // Business Rule: Check all rolls belong to same buyer/order
    await DispatchRules.validateDispatchUniformity(rollIds);

    const firstRoll = rolls[0];
    const buyerId = firstRoll.order.buyerId;
    const orderId = firstRoll.orderId;

    // Business Rule: Validate each roll eligibility
    for (const roll of rolls) {
      // Check roll hasn't been dispatched already
      await DispatchRules.validateDispatchRollEligibility(roll.id);
      
      // Validate roll status allows dispatch
      if (!['PASSED', 'FINISHED_STOCK'].includes(roll.status)) {
        throw new Error(
          `Roll ${roll.rollNumber} is not eligible for dispatch. Status: ${roll.status}. Must be PASSED or FINISHED_STOCK.`
        );
      }

      // Validate status transition to DISPATCHED
      const transition = validateRollStatusTransition(roll.status, 'DISPATCHED');
      if (!transition.valid) {
        throw new Error(`Roll ${roll.rollNumber}: ${transition.error}`);
      }
    }

    // Calculate total metres
    const totalMetres = rolls.reduce((sum, roll) => sum + roll.length, 0);

    // Generate dispatch number
    const count = await tx.dispatch.count();
    const dispatchNumber = `DISP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create dispatch with atomic transaction
    const dispatch = await tx.dispatch.create({
      data: {
        ...mainData,
        dispatchNumber,
        buyerId,
        orderId,
        totalMetres,
        createdBy: userId,
        items: {
          create: rollIds.map((rollId) => ({ rollId })),
        },
      },
      include: {
        buyer: { select: { name: true } },
        order: {
          select: {
            orderNumber: true,
            fabricType: { select: { name: true } },
          },
        },
        items: {
          include: {
            roll: true,
          },
        },
      },
    });

    // Update roll statuses to DISPATCHED atomically
    await tx.fabricRoll.updateMany({
      where: {
        id: { in: rollIds },
      },
      data: {
        status: 'DISPATCHED',
        location: 'DISPATCHED',
      },
    });

    // Update order status based on dispatch completion
    const order = firstRoll.order;
    const allOrderRolls = await tx.fabricRoll.findMany({
      where: { orderId: order.id },
    });

    const allRollsDispatched = allOrderRolls.every((r) => 
      rollIds.includes(r.id) || r.status === 'DISPATCHED'
    );

    if (allRollsDispatched) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'DISPATCHED' },
      });

      // Audit order status change
      await audit({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: 'Order',
        entityId: order.id,
        oldValue: { status: order.status },
        newValue: { status: 'DISPATCHED' },
        notes: `All rolls dispatched via ${dispatchNumber}`,
      });
    }

    // Audit dispatch creation
    await audit({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'Dispatch',
      entityId: dispatch.id,
      newValue: {
        dispatchNumber,
        rollCount: rollIds.length,
        totalMetres,
        buyer: firstRoll.order.buyer.name,
      },
      notes: `Dispatch ${dispatchNumber} created with ${rollIds.length} rolls (${totalMetres}m)`,
    });

    return dispatch;
  });
};

export const getAllDispatches = async (filters = {}) => {
  const { buyerId, orderId, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (buyerId) where.buyerId = buyerId;
  if (orderId) where.orderId = orderId;

  const [dispatches, total] = await Promise.all([
    prisma.dispatch.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        order: { select: { orderNumber: true } },
        items: {
          include: {
            roll: { select: { rollNumber: true, length: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dispatchDate: 'desc' },
    }),
    prisma.dispatch.count({ where }),
  ]);

  return { dispatches, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getDispatchById = async (id) => {
  const dispatch = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      buyer: true,
      order: {
        include: {
          fabricType: true,
        },
      },
      items: {
        include: {
          roll: {
            include: {
              inspections: {
                select: {
                  result: true,
                  grade: true,
                },
                orderBy: { inspectedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
      creator: { select: { name: true, email: true } },
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
        },
      },
    },
  });

  if (!dispatch) {
    throw new Error('Dispatch not found');
  }

  return dispatch;
};

// ============================================
// INVOICES
// ============================================

export const createInvoice = async (invoiceData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // Validate dispatch exists
    const dispatch = await tx.dispatch.findUnique({
      where: { id: invoiceData.dispatchId },
      include: {
        items: {
          include: {
            roll: true,
          },
        },
        invoice: true, // Check if invoice already exists
      },
    });

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    // Check if dispatch already has an invoice
    if (dispatch.invoice) {
      throw new Error(`Dispatch ${dispatch.dispatchNumber} already has invoice ${dispatch.invoice.invoiceNumber}`);
    }

    const {
      totalQuantity,
      taxAmount,
      ...invoiceCreateData
    } = invoiceData;

    const invoiceQuantity = totalQuantity ?? dispatch.totalMetres;

    // Business Rule: Validate invoice quantity matches dispatch quantity
    DispatchRules.validateInvoiceQuantity(invoiceQuantity, dispatch.totalMetres);

    // Validate money fields
    MoneyRules.validateMoney(invoiceData.totalAmount, 'totalAmount');

    // Generate invoice number
    const count = await tx.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        ...invoiceCreateData,
        invoiceNumber,
        buyerId: dispatch.buyerId,
        orderId: dispatch.orderId,
        dispatchId: dispatch.id,
        status: 'PENDING',
        paidAmount: 0,
      },
      include: {
        buyer: { select: { name: true } },
        order: {
          select: {
            orderNumber: true,
            fabricType: { select: { name: true } },
          },
        },
        dispatch: {
          select: {
            dispatchNumber: true,
            dispatchDate: true,
            totalMetres: true,
          },
        },
      },
    });

    // Audit invoice creation
    await audit({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'Invoice',
      entityId: invoice.id,
      newValue: {
        invoiceNumber,
        dispatchNumber: dispatch.dispatchNumber,
        totalAmount: invoice.totalAmount,
        quantity: dispatch.totalMetres,
      },
      notes: `Invoice ${invoiceNumber} created for dispatch ${dispatch.dispatchNumber}`,
    });

    return invoice;
  });
};

export const getAllInvoices = async (filters = {}) => {
  const { buyerId, status, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        order: { select: { orderNumber: true } },
        payments: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { invoiceDate: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  // Calculate outstanding for each invoice
  const invoicesWithBalance = invoices.map((invoice) => ({
    ...invoice,
    outstanding: invoice.totalAmount - invoice.paidAmount,
  }));

  return { 
    invoices: invoicesWithBalance, 
    pagination: { page: parseInt(page), limit: parseInt(limit), total } 
  };
};

export const getInvoiceById = async (id) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      buyer: true,
      order: {
        include: {
          fabricType: true,
        },
      },
      dispatch: {
        include: {
          items: {
            include: {
              roll: {
                select: {
                  rollNumber: true,
                  length: true,
                },
              },
            },
          },
        },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return {
    ...invoice,
    outstanding: invoice.totalAmount - invoice.paidAmount,
  };
};

export const updateInvoice = async (id, updateData) => {
  return await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      buyer: { select: { name: true } },
      order: { select: { orderNumber: true } },
    },
  });
};

// ============================================
// PAYMENTS
// ============================================

export const createPayment = async (paymentData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // Validate money
    MoneyRules.validateMoney(paymentData.amount, 'amount');

    // Get invoice
    const invoice = await tx.invoice.findUnique({
      where: { id: paymentData.invoiceId },
      include: {
        buyer: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const outstanding = invoice.totalAmount - invoice.paidAmount;

    // Business Rule: Payment cannot exceed outstanding balance
    DispatchRules.validatePaymentAllocation(paymentData.amount, outstanding);

    // Create payment
    const payment = await tx.payment.create({
      data: paymentData,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            buyer: { select: { name: true } },
          },
        },
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = invoice.paidAmount + paymentData.amount;
    const newStatus = newPaidAmount >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    await tx.invoice.update({
      where: { id: paymentData.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // Audit payment
    await audit({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'Payment',
      entityId: payment.id,
      newValue: {
        invoiceNumber: invoice.invoiceNumber,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        newStatus,
      },
      notes: `Payment of INR ${MoneyRules.paiseToRupees(paymentData.amount)} received for invoice ${invoice.invoiceNumber}`,
    });

    return payment;
  });
};

export const getAllPayments = async (filters = {}) => {
  const { invoiceId, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (invoiceId) where.invoiceId = invoiceId;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            buyer: { select: { name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getPaymentById = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: {
          buyer: true,
          order: { select: { orderNumber: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
};

// ============================================
// DISPATCH CANCELLATION (Error Correction)
// ============================================

/**
 * Cancel a dispatch (only if no invoice exists)
 * Reverses roll statuses back to FINISHED_STOCK
 */
export const cancelDispatch = async (dispatchId, reason, userId) => {
  return await prisma.$transaction(async (tx) => {
    const dispatch = await tx.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        items: {
          include: {
            roll: true,
          },
        },
        invoice: true,
      },
    });

    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    // Cannot cancel if invoice exists
    if (dispatch.invoice) {
      throw new Error(`Cannot cancel dispatch ${dispatch.dispatchNumber} - Invoice ${dispatch.invoice.invoiceNumber} already exists`);
    }

    // Revert all rolls back to FINISHED_STOCK
    const rollIds = dispatch.items.map(item => item.rollId);
    
    await tx.fabricRoll.updateMany({
      where: {
        id: { in: rollIds },
      },
      data: {
        status: 'FINISHED_STOCK',
        location: 'WAREHOUSE',
      },
    });

    // Delete dispatch items
    await tx.dispatchItem.deleteMany({
      where: {
        dispatchId,
      },
    });

    // Delete dispatch
    await tx.dispatch.delete({
      where: { id: dispatchId },
    });

    // Audit cancellation
    await audit({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      entity: 'Dispatch',
      entityId: dispatchId,
      oldValue: {
        dispatchNumber: dispatch.dispatchNumber,
        rollCount: dispatch.items.length,
      },
      notes: `Dispatch ${dispatch.dispatchNumber} cancelled: ${reason}`,
    });

    return {
      message: 'Dispatch cancelled successfully',
      dispatchNumber: dispatch.dispatchNumber,
      rollsReverted: rollIds.length,
    };
  });
};
