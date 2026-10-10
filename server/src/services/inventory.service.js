import { prisma } from '../config/database.js';
import { StockManager } from '../utils/stockManager.js';
import { validateEntity } from '../utils/businessRules.js';

// ============================================
// SUPPLIERS
// ============================================

export const createSupplier = async (supplierData) => {
  return await prisma.supplier.create({
    data: supplierData,
  });
};

export const getAllSuppliers = async (filters = {}) => {
  const { isActive, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.count({ where }),
  ]);

  return { suppliers, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getSupplierById = async (id) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      gateEntries: {
        take: 10,
        orderBy: { receivedAt: 'desc' },
      },
      purchaseOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  return supplier;
};

export const updateSupplier = async (id, updateData) => {
  return await prisma.supplier.update({
    where: { id },
    data: updateData,
  });
};

export const deleteSupplier = async (id) => {
  await prisma.supplier.delete({ where: { id } });
  return { message: 'Supplier deleted successfully' };
};

// ============================================
// YARN TYPES
// ============================================

export const createYarnType = async (yarnData) => {
  return await prisma.yarnType.create({
    data: yarnData,
  });
};

export const getAllYarnTypes = async (filters = {}) => {
  const { page = 1, limit = 50 } = filters;

  const [yarnTypes, total] = await Promise.all([
    prisma.yarnType.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.yarnType.count(),
  ]);

  return { yarnTypes, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getYarnTypeById = async (id) => {
  const yarnType = await prisma.yarnType.findUnique({
    where: { id },
  });

  if (!yarnType) {
    throw new Error('Yarn type not found');
  }

  return yarnType;
};

export const updateYarnType = async (id, updateData) => {
  return await prisma.yarnType.update({
    where: { id },
    data: updateData,
  });
};

export const deleteYarnType = async (id) => {
  await prisma.yarnType.delete({ where: { id } });
  return { message: 'Yarn type deleted successfully' };
};

// ============================================
// GATE ENTRIES (GRN)
// ============================================

export const createGateEntry = async (entryData) => {
  return await prisma.$transaction(async (tx) => {
    // Validate business rules
    await validateEntity.gateEntry({
      quantity: entryData.quantity,
      challanNumber: entryData.challanNumber,
      supplierId: entryData.supplierId,
      unitPrice: entryData.unitPrice || 0,
    });

    // Check challan number uniqueness per supplier
    const existingChallan = await tx.gateEntry.findFirst({
      where: {
        supplierId: entryData.supplierId,
        challanNumber: entryData.challanNumber,
      },
    });

    if (existingChallan) {
      throw new Error(`Challan number ${entryData.challanNumber} already exists for this supplier`);
    }

    const { unitPrice, userId, ...rawEntry } = entryData;

    // Create gate entry
    const gateEntry = await tx.gateEntry.create({
      data: rawEntry,
      include: {
        supplier: true,
        yarnType: true,
      },
    });

    // Find or create stock batch
    let stockBatch = await tx.stockBatch.findFirst({
      where: {
        yarnTypeId: entryData.yarnTypeId,
        lotNumber: entryData.lotNumber,
      },
    });

    if (stockBatch) {
      // Update existing batch
      stockBatch = await tx.stockBatch.update({
        where: { id: stockBatch.id },
        data: {
          currentQuantity: { increment: entryData.quantity },
          ...(unitPrice ? { unitPrice } : {}),
        },
      });
    } else {
      // Create new batch
      stockBatch = await tx.stockBatch.create({
        data: {
          yarnTypeId: entryData.yarnTypeId,
          lotNumber: entryData.lotNumber,
          currentQuantity: entryData.quantity,
          reservedQuantity: 0,
          unitPrice: unitPrice || 1, // Paise; explicit PO receipt updates the exact price.
        },
      });
    }

    // Create stock movement record using StockManager
    await StockManager.recordMovement(tx, {
      stockBatchId: stockBatch.id,
      movementType: 'IN',
      quantity: entryData.quantity,
      referenceType: 'GATE_ENTRY',
      referenceId: gateEntry.id,
      reason: `GRN: ${gateEntry.grnNumber} from ${gateEntry.supplier.name}`,
      userId: userId || entryData.receivedBy,
    });

    return gateEntry;
  });
};

export const getAllGateEntries = async (filters = {}) => {
  const { supplierId, yarnTypeId, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (yarnTypeId) where.yarnTypeId = yarnTypeId;

  const [entries, total] = await Promise.all([
    prisma.gateEntry.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        yarnType: { select: { name: true, count: true, color: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { receivedAt: 'desc' },
    }),
    prisma.gateEntry.count({ where }),
  ]);

  return { entries, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getGateEntryById = async (id) => {
  const entry = await prisma.gateEntry.findUnique({
    where: { id },
    include: {
      supplier: true,
      yarnType: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!entry) {
    throw new Error('Gate entry not found');
  }

  return entry;
};

// ============================================
// STOCK MANAGEMENT
// ============================================

export const getStockLevels = async (filters = {}) => {
  const { yarnTypeId, lowStock } = filters;

  const whereYarn = {};
  if (yarnTypeId) whereYarn.id = yarnTypeId;

  const [allYarnTypes, batches] = await Promise.all([
    prisma.yarnType.findMany({
      where: whereYarn,
      orderBy: { name: 'asc' },
    }),
    prisma.stockBatch.findMany({
      where: yarnTypeId ? { yarnTypeId } : {},
      include: {
        yarnType: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Group by yarn type and calculate totals
  const stockMap = new Map();

  for (const yt of allYarnTypes) {
    stockMap.set(yt.id, {
      yarnType: yt,
      totalQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      batches: [],
    });
  }

  for (const batch of batches) {
    const key = batch.yarnTypeId;
    if (!stockMap.has(key)) {
      stockMap.set(key, {
        yarnType: batch.yarnType,
        totalQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        batches: [],
      });
    }

    const stock = stockMap.get(key);
    stock.totalQuantity += batch.currentQuantity;
    stock.reservedQuantity += batch.reservedQuantity;
    stock.availableQuantity += (batch.currentQuantity - batch.reservedQuantity);
    stock.batches.push({
      id: batch.id,
      lotNumber: batch.lotNumber,
      currentQuantity: batch.currentQuantity,
      reservedQuantity: batch.reservedQuantity,
      availableQuantity: batch.currentQuantity - batch.reservedQuantity,
      unitPrice: batch.unitPrice,
    });
  }

  let stockLevels = Array.from(stockMap.values());

  // Filter by low stock if requested
  if (lowStock === 'true') {
    stockLevels = stockLevels.filter(
      (stock) => stock.availableQuantity < stock.yarnType.reorderLevel
    );
  }

  return stockLevels;
};

export const getStockLedger = async (filters = {}) => {
  const { yarnTypeId, movementType, page = 1, limit = 100 } = filters;

  const where = {};
  if (movementType) where.movementType = movementType;

  // If yarnTypeId is provided, filter by stock batches of that yarn type
  if (yarnTypeId) {
    where.stockBatch = { yarnTypeId };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        stockBatch: {
          include: {
            yarnType: { select: { name: true, count: true, color: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { movements, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

// ============================================
// STOCK RESERVATIONS & ISSUANCE
// ============================================

/**
 * Reserve yarn stock for an order
 * Uses FIFO batch allocation
 */
export const reserveStockForOrder = async (orderId, yarnRequirements, userId) => {
  return await prisma.$transaction(async (tx) => {
    const reservations = [];

    for (const requirement of yarnRequirements) {
      const { yarnTypeId, quantity } = requirement;

      // Check available stock
      const availability = await StockManager.checkAvailability(tx, yarnTypeId, quantity);
      
      if (!availability.available) {
        throw new Error(
          `Insufficient stock for yarn type ${yarnTypeId}. Required: ${quantity}, Available: ${availability.availableQuantity}`
        );
      }

      // Allocate using FIFO
      const allocations = await StockManager.allocateStock(tx, yarnTypeId, quantity);

      // Create reservations
      for (const allocation of allocations) {
        const reservation = await StockManager.reserveStock(tx, {
          stockBatchId: allocation.batchId,
          quantity: allocation.quantity,
          referenceType: 'ORDER',
          referenceId: orderId,
          userId,
        });

        reservations.push(reservation);
      }
    }

    return reservations;
  });
};

/**
 * Release reserved stock (e.g., when order is cancelled)
 */
export const releaseStockReservation = async (orderId, userId) => {
  return await prisma.$transaction(async (tx) => {
    // Find all reservations for this order
    const reservations = await tx.stockReservation.findMany({
      where: {
        referenceType: 'ORDER',
        referenceId: orderId,
        status: 'RESERVED',
      },
    });

    const released = [];
    for (const reservation of reservations) {
      const result = await StockManager.releaseReservation(tx, reservation.id, userId);
      released.push(result);
    }

    return released;
  });
};

/**
 * Issue stock for production
 * Converts reservation to actual usage and creates OUT movement
 */
export const issueStockForProduction = async (productionLogId, orderId, yarnRequirements, userId) => {
  return await prisma.$transaction(async (tx) => {
    const issues = [];

    for (const requirement of yarnRequirements) {
      const { yarnTypeId, quantity } = requirement;

      // Find reservations for this order and yarn type
      const reservations = await tx.stockReservation.findMany({
        where: {
          referenceType: 'ORDER',
          referenceId: orderId,
          status: 'RESERVED',
          stockBatch: {
            yarnTypeId,
          },
        },
        include: {
          stockBatch: true,
        },
        orderBy: {
          createdAt: 'asc', // FIFO
        },
      });

      let remainingQuantity = quantity;

      for (const reservation of reservations) {
        if (remainingQuantity <= 0) break;

        const issueQuantity = Math.min(remainingQuantity, reservation.quantity);

        // Issue from this batch
        const issued = await StockManager.issueStock(tx, {
          stockBatchId: reservation.stockBatchId,
          quantity: issueQuantity,
          referenceType: 'PRODUCTION',
          referenceId: productionLogId,
          reason: `Issued for production - Order ${orderId}`,
          userId,
        });

        // Update reservation status
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: {
            status: issueQuantity >= reservation.quantity ? 'FULFILLED' : 'RESERVED',
            quantity: reservation.quantity - issueQuantity,
            updatedAt: new Date(),
          },
        });

        issues.push(issued);
        remainingQuantity -= issueQuantity;
      }

      if (remainingQuantity > 0) {
        throw new Error(
          `Insufficient reserved stock for yarn type ${yarnTypeId}. Short by ${remainingQuantity} kg`
        );
      }
    }

    return issues;
  });
};

/**
 * Check low stock alerts
 */
export const getLowStockAlerts = async () => {
  const alerts = await StockManager.getLowStockAlerts(prisma);
  return alerts;
};

/**
 * Get stock availability for a yarn type
 */
export const checkStockAvailability = async (yarnTypeId, requiredQuantity) => {
  return await StockManager.checkAvailability(prisma, yarnTypeId, requiredQuantity);
};

/**
 * Manual stock adjustment (with audit trail)
 */
export const adjustStock = async (stockBatchId, adjustmentData, userId) => {
  return await prisma.$transaction(async (tx) => {
    const { quantity, reason, adjustmentType } = adjustmentData;

    // Validate
    if (quantity === 0) {
      throw new Error('Adjustment quantity cannot be zero');
    }

    const batch = await tx.stockBatch.findUnique({
      where: { id: stockBatchId },
      include: { yarnType: true },
    });

    if (!batch) {
      throw new Error('Stock batch not found');
    }

    // Calculate new quantity
    const newQuantity = batch.currentQuantity + quantity;

    if (newQuantity < 0) {
      throw new Error('Cannot adjust stock below zero');
    }

    if (newQuantity < batch.reservedQuantity) {
      throw new Error(
        `Cannot reduce stock below reserved quantity. Reserved: ${batch.reservedQuantity}, New Total: ${newQuantity}`
      );
    }

    // Update batch
    const updatedBatch = await tx.stockBatch.update({
      where: { id: stockBatchId },
      data: {
        currentQuantity: newQuantity,
      },
    });

    // Record movement
    await StockManager.recordMovement(tx, {
      stockBatchId,
      movementType: 'ADJUST',
      quantity,
      referenceType: 'ADJUSTMENT',
      referenceId: stockBatchId, // Self-reference
      reason: `${adjustmentType}: ${reason}`,
      userId,
    });

    return updatedBatch;
  });
};

// ============================================
// PURCHASE ORDERS
// ============================================

export const createPurchaseOrder = async (poData) => {
  return await prisma.$transaction(async (tx) => {
    const { items, ...orderData } = poData;

    // Validate business rules
    if (!items || items.length === 0) {
      throw new Error('Purchase order must have at least one item');
    }

    // Validate each item
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error('PO item quantity must be greater than zero');
      }
      if (item.unitPrice <= 0) {
        throw new Error('Unit price must be greater than zero');
      }
    }

    // Calculate total amount (in paise)
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Create purchase order
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        ...orderData,
        totalAmount,
        items: {
          create: items,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            yarnType: true,
          },
        },
      },
    });

    return purchaseOrder;
  });
};

export const getAllPurchaseOrders = async (filters = {}) => {
  const { supplierId, status, page = 1, limit = 50 } = filters;

  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            yarnType: { select: { name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getPurchaseOrderById = async (id) => {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          yarnType: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Purchase order not found');
  }

  return order;
};

export const updatePurchaseOrder = async (id, updateData) => {
  return await prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: {
      supplier: true,
      items: {
        include: {
          yarnType: true,
        },
      },
    },
  });
};

export const receivePurchaseOrder = async (id, itemsReceived, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    // Validate items received
    if (!itemsReceived || itemsReceived.length === 0) {
      throw new Error('Must specify items to receive');
    }

    // Update received quantities for each item
    for (const item of itemsReceived) {
      const { itemId, quantityReceived, lotNumber } = item;

      if (quantityReceived <= 0) {
        throw new Error('Received quantity must be greater than zero');
      }

      const poItem = await tx.purchaseOrderItem.findUnique({
        where: { id: itemId },
        include: { yarnType: true },
      });

      if (!poItem) {
        throw new Error(`Purchase order item ${itemId} not found`);
      }

      // Check if receiving more than ordered
      const newReceivedQty = poItem.receivedQuantity + quantityReceived;
      if (newReceivedQty > poItem.quantity) {
        throw new Error(
          `Cannot receive more than ordered. Item ${itemId}: Ordered ${poItem.quantity}, Already Received ${poItem.receivedQuantity}, Attempting ${quantityReceived}`
        );
      }

      // Update PO item
      await tx.purchaseOrderItem.update({
        where: { id: itemId },
        data: {
          receivedQuantity: newReceivedQty,
        },
      });

      // Find or create stock batch with pricing from PO
      let stockBatch = await tx.stockBatch.findFirst({
        where: {
          yarnTypeId: poItem.yarnTypeId,
          lotNumber: lotNumber || `PO-${id}-${itemId}`,
        },
      });

      if (stockBatch) {
        // Update existing batch
        stockBatch = await tx.stockBatch.update({
          where: { id: stockBatch.id },
          data: {
            currentQuantity: { increment: quantityReceived },
            // Update unit price if PO has a different price (weighted average could be implemented)
            unitPrice: poItem.unitPrice,
          },
        });
      } else {
        // Create new batch with PO pricing
        stockBatch = await tx.stockBatch.create({
          data: {
            yarnTypeId: poItem.yarnTypeId,
            lotNumber: lotNumber || `PO-${id}-${itemId}`,
            currentQuantity: quantityReceived,
            reservedQuantity: 0,
            unitPrice: poItem.unitPrice,
          },
        });
      }

      // Record stock movement
      await StockManager.recordMovement(tx, {
        stockBatchId: stockBatch.id,
        movementType: 'IN',
        quantity: quantityReceived,
        referenceType: 'PURCHASE_ORDER',
        referenceId: id,
        reason: `PO Receipt: ${id} - ${poItem.yarnType.name}`,
        userId,
      });
    }

    // Get updated PO with items
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    // Check if all items are fully received
    const allReceived = po.items.every((item) => item.receivedQuantity >= item.quantity);
    const someReceived = po.items.some((item) => item.receivedQuantity > 0);

    // Update PO status
    let newStatus = po.status;
    if (allReceived) {
      newStatus = 'RECEIVED';
    } else if (someReceived) {
      newStatus = 'PARTIALLY_RECEIVED';
    }

    if (newStatus !== po.status) {
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          ...(allReceived && { receivedDate: new Date() }),
        },
      });
    }

    return await tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { yarnType: true } },
      },
    });
  });
};
