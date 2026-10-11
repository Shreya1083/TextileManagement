import { prisma } from '../config/database.js';
import crypto from 'crypto';
import { validateOrderStatusTransition } from '../utils/statusLifecycles.js';
import { StockManager } from '../utils/stockManager.js';
import { validateEntity, OrderRules, MoneyRules } from '../utils/businessRules.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';
import * as inventoryService from './inventory.service.js';

// ============================================
// BUYERS
// ============================================

export const createBuyer = async (buyerData) => {
  return await prisma.buyer.create({
    data: buyerData,
  });
};

export const getAllBuyers = async (filters = {}) => {
  const { isActive, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [buyers, total] = await Promise.all([
    prisma.buyer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.buyer.count({ where }),
  ]);

  return { buyers, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getBuyerById = async (id) => {
  const buyer = await prisma.buyer.findUnique({
    where: { id },
    include: {
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          quantity: true,
          deadline: true,
          createdAt: true,
        },
      },
    },
  });

  if (!buyer) {
    throw new Error('Buyer not found');
  }

  return buyer;
};

export const updateBuyer = async (id, updateData) => {
  return await prisma.buyer.update({
    where: { id },
    data: updateData,
  });
};

export const deleteBuyer = async (id) => {
  await prisma.buyer.delete({ where: { id } });
  return { message: 'Buyer deleted successfully' };
};

// ============================================
// FABRIC TYPES
// ============================================

export const createFabricType = async (fabricData) => {
  return await prisma.fabricType.create({
    data: fabricData,
  });
};

export const getAllFabricTypes = async (filters = {}) => {
  const { page = 1, limit = 50 } = filters;

  const [fabricTypes, total] = await Promise.all([
    prisma.fabricType.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.fabricType.count(),
  ]);

  return { fabricTypes, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getFabricTypeById = async (id) => {
  const fabricType = await prisma.fabricType.findUnique({
    where: { id },
  });

  if (!fabricType) {
    throw new Error('Fabric type not found');
  }

  return fabricType;
};

export const updateFabricType = async (id, updateData) => {
  return await prisma.fabricType.update({
    where: { id },
    data: updateData,
  });
};

export const deleteFabricType = async (id) => {
  await prisma.fabricType.delete({ where: { id } });
  return { message: 'Fabric type deleted successfully' };
};

// ============================================
// ORDERS
// ============================================

export const createOrder = async (orderData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // Validate business rules
    await validateEntity.order(orderData, userId);

    // Generate unique order number
    const count = await tx.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Generate tracking token
    const trackingToken = crypto.randomBytes(16).toString('hex');

    // Create order with initial status
    const order = await tx.order.create({
      data: {
        ...orderData,
        orderNumber,
        trackingToken,
        status: 'DRAFT',
        createdBy: userId,
      },
      include: {
        buyer: { select: { name: true } },
        fabricType: true,
        creator: { select: { name: true, email: true } },
      },
    });

    // Create status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'DRAFT',
        notes: 'Order created',
      },
    });

    // Audit log
    await audit({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'Order',
      entityId: order.id,
      newValue: { orderNumber, status: 'DRAFT', quantity: order.quantity },
      notes: `Order ${orderNumber} created for ${order.buyer.name}`,
    });

    return order;
  });
};

export const getAllOrders = async (filters = {}) => {
  const { buyerId, status, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (buyerId) where.buyerId = buyerId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
        fabricRolls: {
          select: { id: true, rollNumber: true, status: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getOrderById = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: true,
      fabricType: true,
      creator: { select: { name: true, email: true } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      workAssignments: {
        include: {
          machine: { select: { name: true, stage: true } },
        },
      },
      fabricRolls: {
        include: {
          inspections: {
            select: { id: true, result: true, inspectedAt: true },
          },
        },
      },
      dispatches: {
        select: {
          id: true,
          dispatchNumber: true,
          dispatchDate: true,
          totalMetres: true,
        },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
};

export const updateOrder = async (id, updateData) => {
  return await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      buyer: { select: { name: true } },
      fabricType: { select: { name: true } },
    },
  });
};

export const updateOrderStatus = async (id, newStatus, notes = null) => {
  return await prisma.$transaction(async (tx) => {
    // Get current order to check current status
    const currentOrder = await tx.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!currentOrder) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(currentOrder.status, newStatus);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update order status
    const order = await tx.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
      },
    });

    // Create status history entry
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: newStatus,
        notes,
      },
    });

    return order;
  });
};

export const deleteOrder = async (id) => {
  // Check if order has production data
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      workAssignments: true,
      fabricRolls: true,
    },
  });

  if (order.workAssignments.length > 0 || order.fabricRolls.length > 0) {
    throw new Error('Cannot delete order with existing production data');
  }

  await prisma.order.delete({ where: { id } });
  return { message: 'Order deleted successfully' };
};

// ============================================
// YARN AVAILABILITY CHECK
// ============================================

export const checkYarnAvailability = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      fabricType: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Calculate required yarn
  const requiredYarn = order.quantity * order.fabricType.yarnPerMetre;

  // Get available stock (we'll simplify and check total available across all yarn types)
  const stockBatches = await prisma.stockBatch.findMany({
    include: {
      yarnType: true,
    },
  });

  // Calculate total available stock
  let totalAvailable = 0;
  const stockDetails = stockBatches.map((batch) => {
    const available = batch.currentQuantity - batch.reservedQuantity;
    totalAvailable += available;
    return {
      yarnType: batch.yarnType.name,
      lotNumber: batch.lotNumber,
      available,
    };
  });

  const shortage = Math.max(0, requiredYarn - totalAvailable);
  const isSufficient = totalAvailable >= requiredYarn;

  return {
    order: {
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      fabricType: order.fabricType.name,
    },
    yarnRequirement: {
      requiredYarn,
      availableYarn: totalAvailable,
      shortage,
      isSufficient,
    },
    stockDetails: stockDetails.filter((s) => s.available > 0),
  };
};

// ============================================
// CONFIRM ORDER (Reserve Yarn) - Enhanced with Stock Manager Integration
// ============================================

export const confirmOrder = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { fabricType: true, buyer: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Can only confirm from DRAFT status
    const validation = validateOrderStatusTransition(order.status, 'CONFIRMED');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Calculate required yarn
    const requiredYarn = order.quantity * order.fabricType.yarnPerMetre;

    // Check yarn availability using StockManager
    const availability = await StockManager.checkYarnAvailability(order.fabricType.id, order.quantity);

    if (!availability.canFulfill) {
      // Move to YARN_PENDING status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'YARN_PENDING' },
        include: {
          buyer: { select: { name: true } },
          fabricType: { select: { name: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'YARN_PENDING',
          notes: availability.message,
        },
      });

      await audit({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: 'Order',
        entityId: orderId,
        oldValue: { status: order.status },
        newValue: { status: 'YARN_PENDING' },
        notes: `Insufficient yarn. ${availability.message}`,
      });

      throw new Error(`Insufficient yarn to confirm order. ${availability.message}`);
    }

    // Reserve yarn using inventory service
    const yarnRequirements = [{
      yarnTypeId: availability.yarnType.id,
      quantity: requiredYarn,
    }];

    const reservations = await inventoryService.reserveStockForOrder(
      orderId,
      yarnRequirements,
      userId
    );

    // Update order status to CONFIRMED
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CONFIRMED',
        notes: `Order confirmed. Yarn reserved: ${requiredYarn} ${availability.yarnType.unit} across ${reservations.length} batch(es)`,
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'CONFIRMED' },
      notes: `Order confirmed with ${requiredYarn} ${availability.yarnType.unit} reserved`,
    });

    return {
      order: updatedOrder,
      reservations,
      yarnReserved: requiredYarn,
      message: 'Order confirmed successfully',
    };
  });
};

// ============================================
// START PRODUCTION - Transition to IN_PRODUCTION
// ============================================

export const startProduction = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { fabricType: true, buyer: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'IN_PRODUCTION');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'IN_PRODUCTION' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'IN_PRODUCTION',
        notes: 'Production started',
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'IN_PRODUCTION' },
      notes: 'Order moved to production',
    });

    return updatedOrder;
  });
};

// ============================================
// MOVE TO QUALITY CHECK - When rolls are produced
// ============================================

export const moveToQualityCheck = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        fabricType: true,
        buyer: true,
        fabricRolls: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'QUALITY_CHECK');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if there are rolls to inspect
    if (order.fabricRolls.length === 0) {
      throw new Error('Cannot move to quality check - no fabric rolls produced yet');
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'QUALITY_CHECK' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
        fabricRolls: {
          select: { id: true, rollNumber: true, status: true },
        },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'QUALITY_CHECK',
        notes: `${order.fabricRolls.length} rolls sent for quality inspection`,
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'QUALITY_CHECK' },
      notes: `${order.fabricRolls.length} rolls in quality inspection`,
    });

    return updatedOrder;
  });
};

// ============================================
// MARK READY TO SHIP - When QC is complete
// ============================================

export const markReadyToShip = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        fabricType: true,
        buyer: true,
        fabricRolls: {
          include: {
            inspections: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'READY_TO_SHIP');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if all rolls have been inspected
    const uninspectedRolls = order.fabricRolls.filter(roll => roll.inspections.length === 0);
    if (uninspectedRolls.length > 0) {
      throw new Error(`Cannot mark ready to ship - ${uninspectedRolls.length} rolls not yet inspected`);
    }

    // Check if there are passed rolls
    const passedRolls = order.fabricRolls.filter(roll => 
      ['PASSED', 'FINISHED_STOCK'].includes(roll.status)
    );
    
    if (passedRolls.length === 0) {
      throw new Error('Cannot mark ready to ship - no passed rolls available');
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'READY_TO_SHIP' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
        fabricRolls: {
          select: { id: true, rollNumber: true, status: true },
        },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'READY_TO_SHIP',
        notes: `QC complete. ${passedRolls.length} rolls ready for dispatch`,
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'READY_TO_SHIP' },
      notes: `${passedRolls.length} rolls ready for dispatch`,
    });

    return updatedOrder;
  });
};

// ============================================
// MARK DISPATCHED - When shipment is sent
// ============================================

export const markDispatched = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        fabricType: true,
        buyer: true,
        dispatches: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'DISPATCHED');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if there are dispatches
    if (order.dispatches.length === 0) {
      throw new Error('Cannot mark as dispatched - no dispatch records found');
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'DISPATCHED' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
        dispatches: {
          select: {
            id: true,
            dispatchNumber: true,
            dispatchDate: true,
            totalMetres: true,
          },
        },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'DISPATCHED',
        notes: `Order dispatched (${order.dispatches.length} dispatch(es))`,
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'DISPATCHED' },
      notes: `Order dispatched`,
    });

    return updatedOrder;
  });
};

// ============================================
// CLOSE ORDER - Final state
// ============================================

export const closeOrder = async (orderId, userId, notes = null) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        fabricType: true,
        buyer: true,
        invoices: true,
        fabricRolls: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'CLOSED');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check if all invoices are paid
    const unpaidInvoices = order.invoices.filter(inv => inv.paidAmount < inv.totalAmount);
    if (unpaidInvoices.length > 0) {
      throw new Error(`Cannot close order - ${unpaidInvoices.length} invoice(s) still have outstanding balance`);
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CLOSED' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CLOSED',
        notes: notes || 'Order completed and closed',
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'CLOSED' },
      notes: 'Order closed',
    });

    return updatedOrder;
  });
};

// ============================================
// CANCEL ORDER - Can be done from most states
// ============================================

export const cancelOrder = async (orderId, userId, reason) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        fabricType: true,
        buyer: true,
        workAssignments: true,
        fabricRolls: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validation = validateOrderStatusTransition(order.status, 'CANCELLED');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Cannot cancel if dispatched
    if (order.status === 'DISPATCHED' || order.status === 'CLOSED') {
      throw new Error('Cannot cancel order that has been dispatched or closed');
    }

    // Release any reserved stock
    try {
      await inventoryService.releaseStockReservation(orderId, userId);
    } catch (error) {
      // If no reservations exist, that's okay
      console.log('No reservations to release:', error.message);
    }

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        buyer: { select: { name: true } },
        fabricType: { select: { name: true } },
      },
    });

    // Create status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        notes: reason || 'Order cancelled',
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Order',
      entityId: orderId,
      oldValue: { status: order.status },
      newValue: { status: 'CANCELLED' },
      notes: `Order cancelled: ${reason}`,
    });

    return updatedOrder;
  });
};

// ============================================
// PUBLIC ORDER TRACKING
// ============================================

export const trackOrderByToken = async (orderNumber, token) => {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      trackingToken: token,
    },
    select: {
      orderNumber: true,
      status: true,
      quantity: true,
      deadline: true,
      createdAt: true,
      fabricType: {
        select: {
          name: true,
          gsm: true,
          width: true,
        },
      },
      buyer: {
        select: {
          name: true,
        },
      },
      statusHistory: {
        select: {
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      fabricRolls: {
        where: {
          status: { in: ['PASSED', 'FINISHED_STOCK', 'DISPATCHED'] },
        },
        select: {
          status: true,
        },
      },
      dispatches: {
        select: {
          dispatchDate: true,
          totalMetres: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found or invalid tracking token');
  }

  // Calculate progress
  const totalRolls = order.fabricRolls.length;
  const dispatchedRolls = order.fabricRolls.filter((r) => r.status === 'DISPATCHED').length;
  const progressPercentage = order.quantity > 0 ? Math.round((dispatchedRolls / totalRolls) * 100) || 0 : 0;

  return {
    ...order,
    progress: {
      totalRolls,
      dispatchedRolls,
      progressPercentage,
    },
  };
};
