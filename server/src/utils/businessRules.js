/**
 * Comprehensive Business Rules Validation Utility
 * Enforces all database constraints and business logic from README Section 8
 * Used by services before database operations
 */

import { prisma } from '../config/database.js';
import { audit, AUDIT_ACTIONS } from './audit.js';

/**
 * Validation error class for business rule violations
 */
export class BusinessRuleError extends Error {
  constructor(message, rule, field = null) {
    super(message);
    this.name = 'BusinessRuleError';
    this.rule = rule;
    this.field = field;
  }
}

/**
 * INVENTORY & YARN BUSINESS RULES
 */
export const InventoryRules = {
  // Rule 1: GRN quantity must be > 0
  validateGRNQuantity(quantity) {
    if (!quantity || quantity <= 0) {
      throw new BusinessRuleError(
        'GRN quantity must be greater than zero',
        'GRN_QUANTITY_POSITIVE',
        'quantity'
      );
    }
  },

  // Rule 2 & 3: Challan unique per supplier (when provided)
  async validateChallanUniqueness(supplierId, challanNumber, excludeId = null) {
    if (!challanNumber) return; // Optional field
    
    const existingGRN = await prisma.gateEntry.findFirst({
      where: {
        supplierId,
        challanNumber,
        id: excludeId ? { not: excludeId } : undefined,
      }
    });

    if (existingGRN) {
      throw new BusinessRuleError(
        `Challan number ${challanNumber} already exists for this supplier`,
        'CHALLAN_UNIQUE_PER_SUPPLIER',
        'challanNumber'
      );
    }
  },

  // Rule 4: Stock movement quantity cannot be zero
  validateMovementQuantity(quantity) {
    if (quantity === 0) {
      throw new BusinessRuleError(
        'Stock movement quantity cannot be zero',
        'MOVEMENT_QUANTITY_NONZERO',
        'quantity'
      );
    }
  },

  // Rule 5: Stock movement must have valid reference
  validateMovementReference(referenceType, referenceId, reason = null) {
    if (!referenceType || !referenceId) {
      throw new BusinessRuleError(
        'Stock movement must have valid reference type and ID',
        'MOVEMENT_REFERENCE_REQUIRED',
        'referenceType'
      );
    }

    if (referenceType === 'ADJUST' && (!reason || reason.trim().length === 0)) {
      throw new BusinessRuleError(
        'Stock adjustment movements require a reason',
        'ADJUSTMENT_REASON_REQUIRED',
        'reason'
      );
    }
  },

  // Rule 6: Available stock calculation
  calculateAvailableStock(currentQuantity, reservedQuantity) {
    const available = currentQuantity - (reservedQuantity || 0);
    return Math.max(0, available); // Cannot go negative
  },

  // Rule 7: Low stock warning check
  isLowStock(availableQuantity, reorderLevel) {
    return availableQuantity < (reorderLevel || 0);
  },

  // Rule 8: Yarn requirement calculation
  calculateYarnRequired(orderQuantity, yarnPerMetreRatio) {
    if (!orderQuantity || orderQuantity <= 0) {
      throw new BusinessRuleError(
        'Order quantity must be positive for yarn calculation',
        'ORDER_QUANTITY_POSITIVE',
        'quantity'
      );
    }
    return orderQuantity * (yarnPerMetreRatio || 0);
  },
};

/**
 * ORDERS & PRODUCTION BUSINESS RULES
 */
export const OrderRules = {
  // Rule 1: Order quantity > 0, deadline validation
  validateOrder(orderData) {
    if (!orderData.quantity || orderData.quantity <= 0) {
      throw new BusinessRuleError(
        'Order quantity must be greater than zero',
        'ORDER_QUANTITY_POSITIVE',
        'quantity'
      );
    }

    if (orderData.deadline && new Date(orderData.deadline) <= new Date()) {
      throw new BusinessRuleError(
        'Order deadline must be in the future',
        'ORDER_DEADLINE_FUTURE',
        'deadline'
      );
    }
  },

  // Rule 2: Order status lifecycle validation  
  validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'DRAFT': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['YARN_PENDING', 'CANCELLED'],
      'YARN_PENDING': ['IN_PRODUCTION', 'CONFIRMED'], // Can go back if yarn unavailable
      'IN_PRODUCTION': ['QUALITY_CHECK'],
      'QUALITY_CHECK': ['READY_TO_SHIP', 'IN_PRODUCTION'], // Can go back for rework
      'READY_TO_SHIP': ['DISPATCHED'],
      'DISPATCHED': ['CLOSED'],
      'CLOSED': [], // Terminal state
      'CANCELLED': [] // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        'INVALID_STATUS_TRANSITION',
        'status'
      );
    }
  },

  // Rule 3: One active assignment per machine
  async validateMachineAssignment(machineId, excludeAssignmentId = null) {
    const activeAssignment = await prisma.workAssignment.findFirst({
      where: {
        machineId,
        status: 'ACTIVE',
        id: excludeAssignmentId ? { not: excludeAssignmentId } : undefined,
      }
    });

    if (activeAssignment) {
      throw new BusinessRuleError(
        'Machine already has an active work assignment',
        'ONE_ACTIVE_ASSIGNMENT_PER_MACHINE',
        'machineId'
      );
    }
  },

  // Rule 4: Cannot assign to broken/unavailable machines
  async validateMachineAvailability(machineId) {
    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
      select: { status: true, name: true }
    });

    if (!machine) {
      throw new BusinessRuleError(
        'Machine not found',
        'MACHINE_NOT_FOUND',
        'machineId'
      );
    }

    if (['BREAKDOWN', 'MAINTENANCE', 'OUT_OF_ORDER'].includes(machine.status)) {
      throw new BusinessRuleError(
        `Cannot assign work to machine ${machine.name} - status: ${machine.status}`,
        'MACHINE_UNAVAILABLE',
        'machineId'
      );
    }
  },

  // Rule 5: Production output validation
  validateProductionOutput(outputQuantity, wasteQuantity) {
    if (outputQuantity < 0) {
      throw new BusinessRuleError(
        'Production output cannot be negative',
        'OUTPUT_NON_NEGATIVE',
        'outputQuantity'
      );
    }

    if (wasteQuantity < 0) {
      throw new BusinessRuleError(
        'Waste quantity cannot be negative',
        'WASTE_NON_NEGATIVE',
        'wasteQuantity'
      );
    }
  },

  // Rule 7: Roll ID uniqueness
  async validateRollNumber(rollNumber, excludeRollId = null) {
    const existingRoll = await prisma.fabricRoll.findFirst({
      where: {
        rollNumber,
        id: excludeRollId ? { not: excludeRollId } : undefined,
      }
    });

    if (existingRoll) {
      throw new BusinessRuleError(
        `Roll number ${rollNumber} already exists and cannot be reused`,
        'ROLL_NUMBER_UNIQUE',
        'rollNumber'
      );
    }
  },
};

/**
 * QUALITY & ROLL TRACEABILITY RULES
 */
export const QualityRules = {
  // Rule 1: Roll traceability validation
  validateRollTraceability(rollData) {
    if (!rollData.orderId) {
      throw new BusinessRuleError(
        'Every roll must be linked to an order',
        'ROLL_ORDER_REQUIRED',
        'orderId'
      );
    }

    if (!rollData.workAssignmentId) {
      throw new BusinessRuleError(
        'Every roll must be linked to a work assignment',
        'ROLL_ASSIGNMENT_REQUIRED',
        'workAssignmentId'
      );
    }

    if (!rollData.productionDate) {
      throw new BusinessRuleError(
        'Every roll must have a production date',
        'ROLL_PRODUCTION_DATE_REQUIRED',
        'productionDate'
      );
    }
  },

  // Rule 3: Inspection result requirements
  validateInspectionResult(result, remarks) {
    if (!result) {
      throw new BusinessRuleError(
        'Inspection result is mandatory',
        'INSPECTION_RESULT_REQUIRED',
        'result'
      );
    }

    if (['REWORK', 'REJECTED'].includes(result)) {
      if (!remarks || remarks.trim().length === 0) {
        throw new BusinessRuleError(
          `${result} inspection requires a reason in remarks`,
          'INSPECTION_REASON_REQUIRED',
          'remarks'
        );
      }
    }
  },

  // Rule 4: Roll status for finished stock
  validateFinishedStockEligibility(rollStatus) {
    if (!['PASSED', 'RELEASED'].includes(rollStatus)) {
      throw new BusinessRuleError(
        'Only passed and released rolls can enter finished stock',
        'FINISHED_STOCK_PASSED_ONLY',
        'status'
      );
    }
  },

  // Roll status lifecycle validation
  validateRollStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'PRODUCED': ['AWAITING_QC'],
      'AWAITING_QC': ['PASSED', 'REWORK', 'REJECTED'],
      'PASSED': ['FINISHED_STOCK', 'RELEASED'],
      'REWORK': ['AWAITING_QC'], // Re-inspection required
      'REJECTED': [], // Terminal state
      'RELEASED': ['FINISHED_STOCK'],
      'FINISHED_STOCK': ['DISPATCHED'],
      'DISPATCHED': [] // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BusinessRuleError(
        `Invalid roll status transition from ${currentStatus} to ${newStatus}`,
        'INVALID_ROLL_STATUS_TRANSITION',
        'status'
      );
    }
  },
};

/**
 * DISPATCH & INVOICE RULES
 */
export const DispatchRules = {
  // Rule 1: Dispatch roll eligibility
  async validateDispatchRollEligibility(rollId) {
    const roll = await prisma.fabricRoll.findUnique({
      where: { id: rollId },
      include: { 
        order: { select: { buyerId: true } },
        dispatchItems: { select: { id: true } }
      }
    });

    if (!roll) {
      throw new BusinessRuleError(
        'Roll not found',
        'ROLL_NOT_FOUND',
        'rollId'
      );
    }

    // Check if already dispatched
    if (roll.dispatchItems.length > 0) {
      throw new BusinessRuleError(
        `Roll ${roll.rollNumber} has already been dispatched`,
        'ROLL_ALREADY_DISPATCHED',
        'rollId'
      );
    }

    // Check status eligibility
    if (!['PASSED', 'FINISHED_STOCK', 'RELEASED'].includes(roll.status)) {
      throw new BusinessRuleError(
        `Roll ${roll.rollNumber} is not eligible for dispatch (status: ${roll.status})`,
        'ROLL_NOT_ELIGIBLE',
        'rollId'
      );
    }

    return roll;
  },

  // Rule 2: Same buyer/order validation
  async validateDispatchUniformity(rollIds) {
    const rolls = await prisma.fabricRoll.findMany({
      where: { id: { in: rollIds } },
      include: { order: { select: { buyerId: true, id: true } } }
    });

    if (rolls.length === 0) return;

    const firstBuyer = rolls[0].order.buyerId;
    const firstOrder = rolls[0].order.id;

    const differentBuyer = rolls.find(r => r.order.buyerId !== firstBuyer);
    if (differentBuyer) {
      throw new BusinessRuleError(
        'All rolls in a dispatch must belong to the same buyer',
        'DISPATCH_SAME_BUYER',
        'rollIds'
      );
    }

    const differentOrder = rolls.find(r => r.order.id !== firstOrder);
    if (differentOrder) {
      throw new BusinessRuleError(
        'All rolls in a dispatch must belong to the same order',
        'DISPATCH_SAME_ORDER',
        'rollIds'
      );
    }
  },

  // Rule 5: Invoice quantity matching
  validateInvoiceQuantity(invoiceQuantity, dispatchQuantity) {
    if (invoiceQuantity !== dispatchQuantity) {
      throw new BusinessRuleError(
        `Invoice quantity (${invoiceQuantity}) must match dispatch quantity (${dispatchQuantity})`,
        'INVOICE_QUANTITY_MISMATCH',
        'totalQuantity'
      );
    }
  },

  // Rule 7: Payment allocation limits
  validatePaymentAllocation(paymentAmount, outstandingBalance) {
    if (paymentAmount > outstandingBalance) {
      throw new BusinessRuleError(
        `Payment amount (₹${paymentAmount/100}) exceeds outstanding balance (₹${outstandingBalance/100})`,
        'PAYMENT_EXCEEDS_BALANCE',
        'amount'
      );
    }
  },
};

/**
 * ATTENDANCE & WAGE RULES
 */
export const AttendanceRules = {
  // Rule 1: Unique attendance per worker per shift
  async validateAttendanceUniqueness(workerId, date, shiftId, excludeId = null) {
    const existing = await prisma.attendance.findFirst({
      where: {
        workerId,
        date,
        shiftId,
        id: excludeId ? { not: excludeId } : undefined,
      }
    });

    if (existing) {
      throw new BusinessRuleError(
        'Worker already has attendance record for this shift and date',
        'ATTENDANCE_ALREADY_EXISTS',
        'workerId'
      );
    }
  },

  // Rule 2: Manual corrections audit requirements
  validateAttendanceCorrection(originalStatus, newStatus, correctionReason, correctedBy) {
    if (originalStatus !== newStatus) {
      if (!correctionReason || correctionReason.trim().length === 0) {
        throw new BusinessRuleError(
          'Manual attendance corrections require a reason',
          'CORRECTION_REASON_REQUIRED',
          'correctionReason'
        );
      }

      if (!correctedBy) {
        throw new BusinessRuleError(
          'Manual attendance corrections require corrector identification',
          'CORRECTOR_REQUIRED',
          'correctedBy'
        );
      }
    }
  },

  // Rule 3: Wage calculation validation
  validateWageCalculation(daysPresent, overtimeHours, grossWage, deductions, netWage, workerWageData) {
    if (daysPresent < 0) {
      throw new BusinessRuleError(
        'Days present cannot be negative',
        'DAYS_PRESENT_NON_NEGATIVE',
        'daysPresent'
      );
    }

    if (overtimeHours < 0) {
      throw new BusinessRuleError(
        'Overtime hours cannot be negative',
        'OVERTIME_NON_NEGATIVE',
        'overtimeHours'
      );
    }

    if (grossWage < 0 || deductions < 0) {
      throw new BusinessRuleError(
        'Wages and deductions cannot be negative',
        'WAGE_NON_NEGATIVE',
        'grossWage'
      );
    }

    // Validate net wage calculation
    const calculatedNet = grossWage + (overtimeHours * (workerWageData?.overtimeRate || 0)) - deductions;
    if (Math.abs(netWage - calculatedNet) > 1) { // Allow 1 paise tolerance for rounding
      throw new BusinessRuleError(
        `Net wage calculation incorrect. Expected: ${calculatedNet}, Got: ${netWage}`,
        'WAGE_CALCULATION_INVALID',
        'netWage'
      );
    }
  },

  // Rule 4: Locked wage sheet validation
  validateWageSheetLock(isLocked, isAttemptingModification) {
    if (isLocked && isAttemptingModification) {
      throw new BusinessRuleError(
        'Cannot modify locked wage sheet. Controlled reopening required.',
        'WAGE_SHEET_LOCKED',
        'isLocked'
      );
    }
  },
};

/**
 * MONEY & PRECISION RULES
 */
export const MoneyRules = {
  // Rule 5: Money precision validation
  validateMoney(amount, fieldName) {
    if (!Number.isInteger(amount)) {
      throw new BusinessRuleError(
        `${fieldName} must be in integer paise (no decimal places)`,
        'MONEY_INTEGER_PAISE',
        fieldName
      );
    }

    if (amount < 0) {
      throw new BusinessRuleError(
        `${fieldName} cannot be negative`,
        'MONEY_NON_NEGATIVE',
        fieldName
      );
    }
  },

  // Convert rupees to paise for storage
  rupeesToPaise(rupees) {
    return Math.round(rupees * 100);
  },

  // Convert paise to rupees for display
  paiseToRupees(paise) {
    return paise / 100;
  },
};

/**
 * AUDIT LOGGING FOR BUSINESS RULE VIOLATIONS
 */
export const auditBusinessRuleViolation = async (error, userId, entity, entityId, context = {}) => {
  if (error instanceof BusinessRuleError) {
    await audit({
      userId,
      action: AUDIT_ACTIONS.VALIDATION_FAILED,
      entity,
      entityId,
      notes: `Business rule violation: ${error.rule} - ${error.message}`,
      metadata: {
        rule: error.rule,
        field: error.field,
        context
      }
    });
  }
};

/**
 * Utility to validate all business rules for a given entity
 */
export const validateEntity = {
  async gateEntry(data, userId = null, isUpdate = false, existingId = null) {
    InventoryRules.validateGRNQuantity(data.quantity);
    await InventoryRules.validateChallanUniqueness(data.supplierId, data.challanNumber, existingId);
    MoneyRules.validateMoney(data.unitPrice || 0, 'unitPrice');
  },

  async order(data, userId = null, isUpdate = false, existingId = null) {
    OrderRules.validateOrder(data);
    MoneyRules.validateMoney(data.ratePerMetre, 'ratePerMetre');
  },

  async workAssignment(data, userId = null, isUpdate = false, existingId = null) {
    await OrderRules.validateMachineAssignment(data.machineId, existingId);
    await OrderRules.validateMachineAvailability(data.machineId);
  },

  async fabricRoll(data, userId = null, isUpdate = false, existingId = null) {
    await OrderRules.validateRollNumber(data.rollNumber, existingId);
    QualityRules.validateRollTraceability(data);
  },

  async inspection(data, userId = null, isUpdate = false, existingId = null) {
    QualityRules.validateInspectionResult(data.result, data.remarks);
  },

  async attendance(data, userId = null, isUpdate = false, existingId = null) {
    await AttendanceRules.validateAttendanceUniqueness(data.workerId, data.date, data.shiftId, existingId);
    if (data.correctionReason || data.correctedBy) {
      AttendanceRules.validateAttendanceCorrection(
        data.originalStatus, data.status, data.correctionReason, data.correctedBy
      );
    }
  },

  async wageRecord(data, userId = null, isUpdate = false, existingId = null) {
    AttendanceRules.validateWageCalculation(
      data.daysPresent, data.overtime, data.grossWage, data.deductions, data.netWage, data.workerData
    );
    if (isUpdate) {
      AttendanceRules.validateWageSheetLock(data.isLocked, true);
    }
    MoneyRules.validateMoney(data.grossWage, 'grossWage');
    MoneyRules.validateMoney(data.deductions, 'deductions');
    MoneyRules.validateMoney(data.netWage, 'netWage');
  },
};

export default {
  BusinessRuleError,
  InventoryRules,
  OrderRules,
  QualityRules,
  DispatchRules,
  AttendanceRules,
  MoneyRules,
  validateEntity,
  auditBusinessRuleViolation,
};