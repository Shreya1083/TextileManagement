/**
 * Comprehensive Stock Management Utility
 * Handles all stock operations, movements, reservations, and availability calculations
 * Implements README Section 8 Business Rules for Inventory
 */

import { prisma } from '../config/database.js';
import { BusinessRuleError, InventoryRules, MoneyRules } from './businessRules.js';
import { audit, AUDIT_ACTIONS } from './audit.js';

/**
 * Stock Manager - Central hub for all stock operations
 */
export class StockManager {
  /**
   * Create a stock movement (IN, OUT, ADJUST)
   * Enforces business rules and maintains stock balance integrity
   */
  static async createMovement({
    stockBatchId,
    movementType,
    quantity,
    referenceType,
    referenceId,
    reason = null,
    userId = null,
    ipAddress = null,
  }) {
    // Validate movement
    InventoryRules.validateMovementQuantity(quantity);
    InventoryRules.validateMovementReference(referenceType, referenceId, reason);

    return await prisma.$transaction(async (tx) => {
      // Get current stock batch
      const stockBatch = await tx.stockBatch.findUnique({
        where: { id: stockBatchId },
        include: { yarnType: true },
      });

      if (!stockBatch) {
        throw new BusinessRuleError(
          'Stock batch not found',
          'STOCK_BATCH_NOT_FOUND',
          'stockBatchId'
        );
      }

      // Calculate new quantity
      let newQuantity = stockBatch.currentQuantity;
      if (movementType === 'IN') {
        newQuantity += quantity;
      } else if (movementType === 'OUT') {
        newQuantity -= quantity;
        // Check if enough available stock
        const available = stockBatch.currentQuantity - stockBatch.reservedQuantity;
        if (quantity > available) {
          throw new BusinessRuleError(
            `Insufficient available stock. Available: ${available}, Requested: ${quantity}`,
            'INSUFFICIENT_STOCK',
            'quantity'
          );
        }
      } else if (movementType === 'ADJUST') {
        newQuantity += quantity; // quantity can be negative for adjustments
      }

      // Ensure non-negative stock
      if (newQuantity < 0) {
        throw new BusinessRuleError(
          `Stock cannot go negative. Current: ${stockBatch.currentQuantity}, Change: ${quantity}`,
          'NEGATIVE_STOCK',
          'quantity'
        );
      }

      // Update stock batch
      const updatedBatch = await tx.stockBatch.update({
        where: { id: stockBatchId },
        data: { currentQuantity: newQuantity },
      });

      // Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          stockBatchId,
          userId,
          movementType,
          quantity,
          referenceType,
          referenceId,
          reason,
        },
      });

      // Audit stock movement
      await audit({
        userId,
        action: AUDIT_ACTIONS.STOCK_ADJUST,
        entity: 'StockMovement',
        entityId: movement.id,
        oldValue: { currentQuantity: stockBatch.currentQuantity },
        newValue: { currentQuantity: newQuantity },
        ipAddress,
        notes: `${movementType} movement of ${quantity} ${stockBatch.yarnType.unit}. Ref: ${referenceType}:${referenceId}`,
      });

      return {
        movement,
        updatedBatch,
        previousQuantity: stockBatch.currentQuantity,
        newQuantity,
      };
    });
  }

  /**
   * Reserve stock for an order
   * Prevents the stock from being used elsewhere
   */
  static async reserveStock({
    yarnTypeId,
    quantity,
    orderId,
    userId = null,
    ipAddress = null,
  }) {
    if (quantity <= 0) {
      throw new BusinessRuleError(
        'Reservation quantity must be positive',
        'INVALID_RESERVATION_QUANTITY',
        'quantity'
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Find available stock batches for this yarn type (FIFO)
      const batches = await tx.stockBatch.findMany({
        where: {
          yarnTypeId,
          currentQuantity: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' }, // FIFO
        include: { yarnType: true },
      });

      let remainingToReserve = quantity;
      const reservations = [];

      for (const batch of batches) {
        if (remainingToReserve <= 0) break;

        const available = batch.currentQuantity - batch.reservedQuantity;
        if (available <= 0) continue;

        const toReserve = Math.min(available, remainingToReserve);

        // Update batch reservation
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            reservedQuantity: { increment: toReserve },
          },
        });

        reservations.push({
          batchId: batch.id,
          lotNumber: batch.lotNumber,
          quantity: toReserve,
        });

        remainingToReserve -= toReserve;

        // Audit reservation
        await audit({
          userId,
          action: AUDIT_ACTIONS.CREATE,
          entity: 'StockReservation',
          entityId: batch.id,
          newValue: { orderId, quantity: toReserve },
          ipAddress,
          notes: `Reserved ${toReserve} ${batch.yarnType.unit} for order ${orderId}`,
        });
      }

      if (remainingToReserve > 0) {
        throw new BusinessRuleError(
          `Insufficient stock to reserve. Required: ${quantity}, Available: ${quantity - remainingToReserve}`,
          'INSUFFICIENT_STOCK_FOR_RESERVATION',
          'quantity'
        );
      }

      return {
        totalReserved: quantity,
        reservations,
        message: `Successfully reserved ${quantity} units across ${reservations.length} batch(es)`,
      };
    });
  }

  /**
   * Release reserved stock (when order is cancelled or modified)
   */
  static async releaseReservation({
    yarnTypeId,
    quantity,
    orderId,
    userId = null,
    ipAddress = null,
  }) {
    return await prisma.$transaction(async (tx) => {
      // Find batches with reservations for this yarn type (FIFO release)
      const batches = await tx.stockBatch.findMany({
        where: {
          yarnTypeId,
          reservedQuantity: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
        include: { yarnType: true },
      });

      let remainingToRelease = quantity;
      const releases = [];

      for (const batch of batches) {
        if (remainingToRelease <= 0) break;
        if (batch.reservedQuantity <= 0) continue;

        const toRelease = Math.min(batch.reservedQuantity, remainingToRelease);

        // Update batch reservation
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            reservedQuantity: { decrement: toRelease },
          },
        });

        releases.push({
          batchId: batch.id,
          lotNumber: batch.lotNumber,
          quantity: toRelease,
        });

        remainingToRelease -= toRelease;

        // Audit release
        await audit({
          userId,
          action: AUDIT_ACTIONS.DELETE,
          entity: 'StockReservation',
          entityId: batch.id,
          oldValue: { orderId, quantity: toRelease },
          ipAddress,
          notes: `Released ${toRelease} ${batch.yarnType.unit} reservation for order ${orderId}`,
        });
      }

      return {
        totalReleased: quantity - remainingToRelease,
        releases,
        message: `Released ${quantity - remainingToRelease} units across ${releases.length} batch(es)`,
      };
    });
  }

  /**
   * Issue stock for production (OUT movement + release reservation)
   */
  static async issueForProduction({
    yarnTypeId,
    quantity,
    orderId,
    workAssignmentId,
    userId = null,
    ipAddress = null,
  }) {
    return await prisma.$transaction(async (tx) => {
      // Find reserved batches for this order (FIFO)
      const batches = await tx.stockBatch.findMany({
        where: {
          yarnTypeId,
          reservedQuantity: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' },
        include: { yarnType: true },
      });

      let remainingToIssue = quantity;
      const issuances = [];
      let totalCost = 0;

      for (const batch of batches) {
        if (remainingToIssue <= 0) break;

        // Calculate how much we can issue from this batch
        const availableReserved = batch.reservedQuantity;
        if (availableReserved <= 0) continue;

        const toIssue = Math.min(availableReserved, remainingToIssue);

        // Create OUT movement
        const movement = await this.createMovement({
          stockBatchId: batch.id,
          movementType: 'OUT',
          quantity: toIssue,
          referenceType: 'PRODUCTION',
          referenceId: workAssignmentId || orderId,
          reason: `Issued for production - Order: ${orderId}`,
          userId,
          ipAddress,
        });

        // Release reservation
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            reservedQuantity: { decrement: toIssue },
          },
        });

        // Calculate cost
        const cost = toIssue * batch.unitPrice;
        totalCost += cost;

        issuances.push({
          batchId: batch.id,
          lotNumber: batch.lotNumber,
          quantity: toIssue,
          unitPrice: batch.unitPrice,
          cost,
          movement: movement.movement,
        });

        remainingToIssue -= toIssue;
      }

      if (remainingToIssue > 0) {
        throw new BusinessRuleError(
          `Insufficient reserved stock to issue. Required: ${quantity}, Available: ${quantity - remainingToIssue}`,
          'INSUFFICIENT_RESERVED_STOCK',
          'quantity'
        );
      }

      return {
        totalIssued: quantity,
        totalCost,
        issuances,
        message: `Issued ${quantity} units costing ₹${(totalCost / 100).toFixed(2)}`,
      };
    });
  }

  /**
   * Check yarn availability for an order
   * Returns required quantity, available quantity, and shortage
   */
  static async checkYarnAvailability(fabricTypeId, orderQuantity) {
    // Get fabric type with yarn requirements
    const fabricType = await prisma.fabricType.findUnique({
      where: { id: fabricTypeId },
    });

    if (!fabricType) {
      throw new BusinessRuleError(
        'Fabric type not found',
        'FABRIC_TYPE_NOT_FOUND',
        'fabricTypeId'
      );
    }

    // Calculate required yarn
    const requiredYarn = InventoryRules.calculateYarnRequired(
      orderQuantity,
      fabricType.yarnPerMetre
    );

    // MVP simplification: FabricType stores consumption ratio, but not a yarn-type FK.
    // Use the first yarn type with enough available stock, otherwise report shortage
    // against the first configured yarn type.
    const yarnTypes = await prisma.yarnType.findMany({
      include: { stockBatches: true },
      orderBy: { name: 'asc' },
    });

    const yarnTypeWithAvailability = yarnTypes
      .map((type) => ({
        ...type,
        availableQuantity: type.stockBatches.reduce(
          (sum, batch) => sum + (batch.currentQuantity - batch.reservedQuantity),
          0
        ),
      }))
      .sort((a, b) => b.availableQuantity - a.availableQuantity);

    const yarnType = yarnTypeWithAvailability.find((type) => type.availableQuantity >= requiredYarn)
      || yarnTypeWithAvailability[0];

    if (!yarnType) {
      return {
        requiredYarn,
        availableYarn: 0,
        shortage: requiredYarn,
        yarnType: null,
        canFulfill: false,
        message: 'No yarn types are configured in inventory',
      };
    }

    const totalAvailable = yarnType.availableQuantity;

    const shortage = Math.max(0, requiredYarn - totalAvailable);

    return {
      requiredYarn,
      availableYarn: totalAvailable,
      shortage,
      yarnType,
      canFulfill: shortage === 0,
      message: shortage > 0 
        ? `Shortage of ${shortage} ${yarnType.unit}. Need to procure.`
        : `Sufficient yarn available (${totalAvailable} ${yarnType.unit})`,
    };
  }

  /**
   * Get low stock alerts
   * Returns items where available < reorder level
   */
  static async getLowStockAlerts(txOrPrisma = prisma) {
    const client = txOrPrisma;

    const yarnTypes = await client.yarnType.findMany({
      include: {
        stockBatches: true,
      },
    });

    const alerts = [];

    for (const yarnType of yarnTypes) {
      const totalCurrent = yarnType.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );
      const totalReserved = yarnType.stockBatches.reduce(
        (sum, batch) => sum + batch.reservedQuantity,
        0
      );
      const available = InventoryRules.calculateAvailableStock(totalCurrent, totalReserved);

      if (InventoryRules.isLowStock(available, yarnType.reorderLevel)) {
        alerts.push({
          yarnTypeId: yarnType.id,
          yarnType,
          name: yarnType.name,
          count: yarnType.count,
          color: yarnType.color,
          currentStock: totalCurrent,
          reservedStock: totalReserved,
          availableStock: available,
          availableQuantity: available,
          reorderLevel: yarnType.reorderLevel,
          shortfall: yarnType.reorderLevel - available,
          shortage: yarnType.reorderLevel - available,
          severity: available === 0 ? 'CRITICAL' : available < yarnType.reorderLevel / 2 ? 'HIGH' : 'MEDIUM',
        });
      }
    }

    // Sort by severity
    alerts.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return alerts;
  }

  /**
   * Get comprehensive stock summary
   */
  static async getStockSummary() {
    const yarnTypes = await prisma.yarnType.findMany({
      include: {
        stockBatches: true,
      },
    });

    const summary = yarnTypes.map(yarnType => {
      const totalCurrent = yarnType.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );
      const totalReserved = yarnType.stockBatches.reduce(
        (sum, batch) => sum + batch.reservedQuantity,
        0
      );
      const available = totalCurrent - totalReserved;
      const totalValue = yarnType.stockBatches.reduce(
        (sum, batch) => sum + (batch.currentQuantity * batch.unitPrice),
        0
      );

      return {
        yarnTypeId: yarnType.id,
        name: yarnType.name,
        count: yarnType.count,
        color: yarnType.color,
        unit: yarnType.unit,
        currentStock: totalCurrent,
        reservedStock: totalReserved,
        availableStock: available,
        reorderLevel: yarnType.reorderLevel,
        stockValue: totalValue, // in paise
        isLowStock: available < yarnType.reorderLevel,
        batches: yarnType.stockBatches.map(batch => ({
          id: batch.id,
          lotNumber: batch.lotNumber,
          currentQuantity: batch.currentQuantity,
          reservedQuantity: batch.reservedQuantity,
          availableQuantity: batch.currentQuantity - batch.reservedQuantity,
          unitPrice: batch.unitPrice,
        })),
      };
    });

    // Calculate totals
    const totals = {
      totalYarnTypes: summary.length,
      totalCurrentStock: summary.reduce((sum, s) => sum + s.currentStock, 0),
      totalReservedStock: summary.reduce((sum, s) => sum + s.reservedStock, 0),
      totalAvailableStock: summary.reduce((sum, s) => sum + s.availableStock, 0),
      totalStockValue: summary.reduce((sum, s) => sum + s.stockValue, 0),
      lowStockCount: summary.filter(s => s.isLowStock).length,
    };

    return { summary, totals };
  }

  /**
   * Adjust stock (for corrections, damage, etc.)
   * Requires reason and authorization
   */
  static async adjustStock({
    stockBatchId,
    quantity,
    reason,
    userId,
    ipAddress = null,
  }) {
    if (!reason || reason.trim().length === 0) {
      throw new BusinessRuleError(
        'Stock adjustment requires a detailed reason',
        'ADJUSTMENT_REASON_REQUIRED',
        'reason'
      );
    }

    if (!userId) {
      throw new BusinessRuleError(
        'Stock adjustment requires user authorization',
        'USER_AUTHORIZATION_REQUIRED',
        'userId'
      );
    }

    return await this.createMovement({
      stockBatchId,
      movementType: 'ADJUST',
      quantity,
      referenceType: 'ADJUSTMENT',
      referenceId: userId,
      reason,
      userId,
      ipAddress,
    });
  }

  /**
   * Transfer stock between batches (for consolidation)
   */
  static async transferStock({
    fromBatchId,
    toBatchId,
    quantity,
    reason,
    userId,
    ipAddress = null,
  }) {
    return await prisma.$transaction(async (tx) => {
      // OUT from source batch
      const outMovement = await this.createMovement({
        stockBatchId: fromBatchId,
        movementType: 'OUT',
        quantity,
        referenceType: 'TRANSFER',
        referenceId: toBatchId,
        reason: reason || `Transfer to batch ${toBatchId}`,
        userId,
        ipAddress,
      });

      // IN to destination batch
      const inMovement = await this.createMovement({
        stockBatchId: toBatchId,
        movementType: 'IN',
        quantity,
        referenceType: 'TRANSFER',
        referenceId: fromBatchId,
        reason: reason || `Transfer from batch ${fromBatchId}`,
        userId,
        ipAddress,
      });

      return {
        outMovement,
        inMovement,
        message: `Transferred ${quantity} units successfully`,
      };
    });
  }

  /**
   * Check stock availability for a yarn type
   * Returns availability status and details
   */
  static async checkAvailability(txOrPrisma, yarnTypeId, requiredQuantity) {
    const client = txOrPrisma;

    const batches = await client.stockBatch.findMany({
      where: {
        yarnTypeId,
        currentQuantity: { gt: 0 },
      },
      include: { yarnType: true },
    });

    const totalStock = batches.reduce((sum, b) => sum + b.currentQuantity, 0);
    const totalReserved = batches.reduce((sum, b) => sum + b.reservedQuantity, 0);
    const availableQuantity = totalStock - totalReserved;

    return {
      available: availableQuantity >= requiredQuantity,
      availableQuantity,
      requiredQuantity,
      shortage: Math.max(0, requiredQuantity - availableQuantity),
      totalStock,
      totalReserved,
      batches: batches.map(b => ({
        id: b.id,
        lotNumber: b.lotNumber,
        current: b.currentQuantity,
        reserved: b.reservedQuantity,
        available: b.currentQuantity - b.reservedQuantity,
      })),
    };
  }

  /**
   * Allocate stock using FIFO method
   * Returns array of allocations from batches
   */
  static async allocateStock(txOrPrisma, yarnTypeId, requiredQuantity) {
    const client = txOrPrisma;

    const batches = await client.stockBatch.findMany({
      where: {
        yarnTypeId,
        currentQuantity: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' }, // FIFO
    });

    const allocations = [];
    let remaining = requiredQuantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const available = batch.currentQuantity - batch.reservedQuantity;
      if (available <= 0) continue;

      const allocated = Math.min(available, remaining);
      allocations.push({
        batchId: batch.id,
        lotNumber: batch.lotNumber,
        quantity: allocated,
        available,
      });

      remaining -= allocated;
    }

    if (remaining > 0) {
      throw new BusinessRuleError(
        `Cannot allocate ${requiredQuantity}. Short by ${remaining}`,
        'INSUFFICIENT_STOCK',
        'quantity'
      );
    }

    return allocations;
  }

  /**
   * Reserve stock with database update
   */
  static async reserveStock(txOrPrisma, reservationData) {
    const client = txOrPrisma;
    const { stockBatchId, quantity, referenceType, referenceId, userId } = reservationData;

    // Update batch reserved quantity
    await client.stockBatch.update({
      where: { id: stockBatchId },
      data: {
        reservedQuantity: { increment: quantity },
      },
    });

    // Create reservation record
    const reservation = await client.stockReservation.create({
      data: {
        stockBatchId,
        quantity,
        referenceType,
        referenceId,
        status: 'RESERVED',
      },
    });

    return reservation;
  }

  /**
   * Release a reservation
   */
  static async releaseReservation(txOrPrisma, reservationId, userId) {
    const client = txOrPrisma;

    const reservation = await client.stockReservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'RESERVED') {
      throw new Error(`Cannot release reservation with status: ${reservation.status}`);
    }

    // Update batch reserved quantity
    await client.stockBatch.update({
      where: { id: reservation.stockBatchId },
      data: {
        reservedQuantity: { decrement: reservation.quantity },
      },
    });

    // Update reservation status
    const updated = await client.stockReservation.update({
      where: { id: reservationId },
      data: {
        status: 'RELEASED',
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Issue stock (reduces current quantity and reserved quantity)
   */
  static async issueStock(txOrPrisma, issueData) {
    const client = txOrPrisma;
    const { stockBatchId, quantity, referenceType, referenceId, reason, userId } = issueData;

    // Update batch
    await client.stockBatch.update({
      where: { id: stockBatchId },
      data: {
        currentQuantity: { decrement: quantity },
        reservedQuantity: { decrement: quantity },
      },
    });

    // Create movement record
    const movement = await client.stockMovement.create({
        data: {
          stockBatchId,
          userId,
          movementType: 'OUT',
        quantity,
        referenceType,
        referenceId,
        reason,
      },
    });

    return movement;
  }

  /**
   * Record a stock movement (simple version for audit trail)
   */
  static async recordMovement(txOrPrisma, movementData) {
    const client = txOrPrisma;
    const { userId, ...movement } = movementData;

    const created = await client.stockMovement.create({
      data: {
        ...movement,
        userId,
      },
    });

    return created;
  }
}

export default StockManager;
