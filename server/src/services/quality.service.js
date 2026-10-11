import { prisma } from '../config/database.js';
import { generateQRCode } from '../utils/qrcode.js';
import { validateRollStatusTransition } from '../utils/statusLifecycles.js';
import { validateEntity, QualityRules } from '../utils/businessRules.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';

// ============================================
// FABRIC ROLLS
// ============================================

export const getAllFabricRolls = async (filters = {}) => {
  const { orderId, status, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (orderId) where.orderId = orderId;
  if (status) where.status = status;

  const [rolls, total] = await Promise.all([
    prisma.fabricRoll.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
          },
        },
        machine: { select: { name: true, stage: true } },
        inspections: {
          select: {
            id: true,
            result: true,
            inspectedAt: true,
          },
          orderBy: { inspectedAt: 'desc' },
          take: 1,
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { productionDate: 'desc' },
    }),
    prisma.fabricRoll.count({ where }),
  ]);

  return { rolls, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getFabricRollById = async (id) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          buyer: { select: { name: true } },
          fabricType: true,
        },
      },
      machine: true,
      workAssignment: {
        include: {
          assignedByUser: { select: { name: true } },
        },
      },
      inspections: {
        include: {
          inspector: { select: { name: true, email: true } },
          defects: true,
        },
        orderBy: { inspectedAt: 'desc' },
      },
    },
  });

  if (!roll) {
    throw new Error('Fabric roll not found');
  }

  return roll;
};

export const getFabricRollByNumber = async (rollNumber) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { rollNumber },
    include: {
      order: {
        select: {
          orderNumber: true,
          buyer: { select: { name: true } },
          fabricType: { select: { name: true } },
        },
      },
      machine: { select: { name: true, stage: true } },
      inspections: {
        include: {
          inspector: { select: { name: true } },
          defects: true,
        },
        orderBy: { inspectedAt: 'desc' },
      },
    },
  });

  if (!roll) {
    throw new Error('Fabric roll not found');
  }

  return roll;
};

export const updateFabricRoll = async (id, updateData) => {
  return await prisma.fabricRoll.update({
    where: { id },
    data: updateData,
  });
};

export const generateRollQRCode = async (rollId) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { id: rollId },
  });

  if (!roll) {
    throw new Error('Fabric roll not found');
  }

  // Generate QR code data URL
  const qrData = JSON.stringify({
    type: 'FABRIC_ROLL',
    rollNumber: roll.rollNumber,
    rollId: roll.id,
  });

  const qrCodeDataURL = await generateQRCode(qrData);

  // Save QR code reference
  await prisma.fabricRoll.update({
    where: { id: rollId },
    data: { qrCode: qrCodeDataURL },
  });

  return {
    rollNumber: roll.rollNumber,
    qrCode: qrCodeDataURL,
  };
};

// ============================================
// INSPECTIONS
// ============================================

export const createInspection = async (inspectionData, userId) => {
  return await prisma.$transaction(async (tx) => {
    const { defects, ...mainData } = inspectionData;

    // Validate business rules
    await validateEntity.inspection(mainData, userId);

    // Verify roll exists and is AWAITING_QC
    const roll = await tx.fabricRoll.findUnique({
      where: { id: mainData.rollId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            buyer: { select: { name: true } },
          },
        },
        machine: { select: { name: true } },
      },
    });

    if (!roll) throw new Error('Fabric roll not found');
    
    // Validate roll status
    if (roll.status !== 'AWAITING_QC' && roll.status !== 'REWORK') {
      throw new Error(
        `Roll ${roll.rollNumber} cannot be inspected. Current status: ${roll.status}. Must be AWAITING_QC or REWORK.`
      );
    }

    // Validate inspection result has reason for rework/reject
    QualityRules.validateInspectionResult(mainData.result, mainData.remarks);

    // Create inspection
    const inspection = await tx.inspection.create({
      data: {
        ...mainData,
        inspectorId: userId,
        defects: defects ? { create: defects } : undefined,
      },
      include: {
        roll: true,
        inspector: { select: { name: true, email: true } },
        defects: true,
      },
    });

    // Validate and update roll status based on inspection result
    let newStatus;
    switch (inspection.result) {
      case 'PASS':
        newStatus = 'PASSED';
        break;
      case 'REWORK':
        newStatus = 'REWORK';
        // Check rework reason is provided
        if (!inspection.remarks || inspection.remarks.trim().length === 0) {
          throw new Error('Rework reason is mandatory');
        }
        break;
      case 'REJECT':
        newStatus = 'REJECTED';
        // Check reject reason is provided
        if (!inspection.remarks || inspection.remarks.trim().length === 0) {
          throw new Error('Reject reason is mandatory');
        }
        break;
      default:
        throw new Error(`Invalid inspection result: ${inspection.result}`);
    }

    // Validate status transition
    const statusValidation = validateRollStatusTransition(roll.status, newStatus);
    if (!statusValidation.valid) {
      throw new Error(statusValidation.error);
    }

    // Update roll status
    const updatedRoll = await tx.fabricRoll.update({
      where: { id: inspection.rollId },
      data: {
        status: newStatus,
        ...(newStatus === 'PASSED' ? { location: 'QC_PASSED' } : {}),
      },
    });

    // Create audit log
    await audit({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'Inspection',
      entityId: inspection.id,
      newValue: {
        rollNumber: roll.rollNumber,
        result: inspection.result,
        defectCount: defects?.length || 0,
      },
      notes: `QC ${inspection.result} for roll ${roll.rollNumber}`,
    });

    // If rejected, audit the roll status change
    if (newStatus === 'REJECTED') {
      await audit({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: 'FabricRoll',
        entityId: roll.id,
        oldValue: { status: roll.status },
        newValue: { status: 'REJECTED' },
        notes: `Roll rejected: ${inspection.remarks}`,
      });
    }

    return { ...inspection, roll: updatedRoll };
  });
};

export const getAllInspections = async (filters = {}) => {
  const { rollId, inspectorId, result, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (rollId) where.rollId = rollId;
  if (inspectorId) where.inspectorId = inspectorId;
  if (result) where.result = result;

  const [inspections, total] = await Promise.all([
    prisma.inspection.findMany({
      where,
      include: {
        roll: {
          select: {
            rollNumber: true,
            order: {
              select: {
                orderNumber: true,
                buyer: { select: { name: true } },
              },
            },
          },
        },
        inspector: { select: { name: true } },
        defects: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { inspectedAt: 'desc' },
    }),
    prisma.inspection.count({ where }),
  ]);

  return { inspections, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getInspectionById = async (id) => {
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      roll: {
        include: {
          order: {
            include: {
              buyer: { select: { name: true } },
              fabricType: true,
            },
          },
          machine: { select: { name: true } },
        },
      },
      inspector: { select: { name: true, email: true } },
      defects: true,
    },
  });

  if (!inspection) {
    throw new Error('Inspection not found');
  }

  return inspection;
};

// Get inspection queue (rolls awaiting QC)
export const getInspectionQueue = async (filters = {}) => {
  const { orderId, page = 1, limit = 50 } = filters;
  
  const where = { status: 'AWAITING_QC' };
  if (orderId) where.orderId = orderId;

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
        machine: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { productionDate: 'asc' }, // Oldest first
    }),
    prisma.fabricRoll.count({ where }),
  ]);

  return { rolls, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

// ============================================
// DEFECT REPORTS
// ============================================

export const getDefectReport = async (filters = {}) => {
  const { orderId, machineId, startDate, endDate, defectType } = filters;

  const where = {};
  
  if (defectType) where.defectType = defectType;

  // Build inspection filter
  const inspectionWhere = {};
  if (startDate || endDate) {
    inspectionWhere.inspectedAt = {};
    if (startDate) inspectionWhere.inspectedAt.gte = new Date(startDate);
    if (endDate) inspectionWhere.inspectedAt.lte = new Date(endDate);
  }

  // Build roll filter
  const rollWhere = {};
  if (orderId) rollWhere.orderId = orderId;
  if (machineId) rollWhere.machineId = machineId;

  if (Object.keys(rollWhere).length > 0) {
    inspectionWhere.roll = rollWhere;
  }

  if (Object.keys(inspectionWhere).length > 0) {
    where.inspection = inspectionWhere;
  }

  // Get all defects with grouping
  const defects = await prisma.defect.findMany({
    where,
    include: {
      inspection: {
        include: {
          roll: {
            select: {
              rollNumber: true,
              order: {
                select: {
                  orderNumber: true,
                  buyer: { select: { name: true } },
                },
              },
              machine: { select: { name: true } },
            },
          },
          inspector: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by defect type
  const defectSummary = defects.reduce((acc, defect) => {
    if (!acc[defect.defectType]) {
      acc[defect.defectType] = {
        type: defect.defectType,
        totalCount: 0,
        occurrences: 0,
      };
    }
    acc[defect.defectType].totalCount += defect.count;
    acc[defect.defectType].occurrences += 1;
    return acc;
  }, {});

  return {
    summary: Object.values(defectSummary),
    details: defects,
    totalDefects: defects.reduce((sum, d) => sum + d.count, 0),
  };
};

// Get quality statistics
export const getQualityStatistics = async (filters = {}) => {
  const { startDate, endDate, orderId } = filters;

  const where = {};
  if (startDate || endDate) {
    where.inspectedAt = {};
    if (startDate) where.inspectedAt.gte = new Date(startDate);
    if (endDate) where.inspectedAt.lte = new Date(endDate);
  }

  if (orderId) {
    where.roll = { orderId };
  }

  // Get all inspections
  const inspections = await prisma.inspection.findMany({
    where,
    include: {
      defects: true,
    },
  });

  // Calculate statistics
  const total = inspections.length;
  const passed = inspections.filter((i) => i.result === 'PASS').length;
  const rework = inspections.filter((i) => i.result === 'REWORK').length;
  const rejected = inspections.filter((i) => i.result === 'REJECT').length;

  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
  const rejectRate = total > 0 ? ((rejected / total) * 100).toFixed(2) : 0;

  const totalDefects = inspections.reduce(
    (sum, i) => sum + i.defects.reduce((s, d) => s + d.count, 0),
    0
  );

  return {
    totalInspections: total,
    passed,
    rework,
    rejected,
    passRate: parseFloat(passRate),
    rejectRate: parseFloat(rejectRate),
    totalDefects,
    averageDefectsPerInspection: total > 0 ? (totalDefects / total).toFixed(2) : 0,
  };
};

// ============================================
// ROLL TRACEABILITY
// ============================================

/**
 * Get complete traceability information for a roll
 * Includes: Order, Yarn batches used, Production details, QC history, Dispatch info
 */
export const getRollTraceability = async (rollNumber) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { rollNumber },
    include: {
      order: {
        include: {
          buyer: true,
          fabricType: true,
          creator: { select: { name: true, email: true } },
        },
      },
      machine: true,
      workAssignment: {
        include: {
          assignedByUser: { select: { name: true } },
        },
      },
      inspections: {
        include: {
          inspector: { select: { name: true, email: true } },
          defects: true,
        },
        orderBy: { inspectedAt: 'asc' },
      },
      dispatchItems: {
        include: {
          dispatch: {
            include: {
              buyer: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!roll) {
    throw new Error('Fabric roll not found');
  }

  const productionLog = await prisma.productionLog.findFirst({
    where: {
      orderId: roll.orderId,
      machineId: roll.machineId || undefined,
      workAssignmentId: roll.workAssignmentId || undefined,
      date: {
        lte: roll.productionDate,
      },
    },
    include: {
      operator: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Get yarn/stock batches used for this order (via stock movements)
  const yarnUsed = await prisma.stockMovement.findMany({
    where: {
      referenceType: 'PRODUCTION',
      referenceId: productionLog?.id || roll.orderId,
    },
    include: {
      stockBatch: {
        include: {
          yarnType: true,
        },
      },
    },
  });

  // Build traceability report
  const traceability = {
    roll: {
      rollNumber: roll.rollNumber,
      length: roll.length,
      weight: roll.weight,
      status: roll.status,
      productionDate: roll.productionDate,
      location: roll.location,
    },
    order: {
      orderNumber: roll.order.orderNumber,
      buyer: roll.order.buyer.name,
      fabricType: roll.order.fabricType.name,
      orderDate: roll.order.createdAt,
      deadline: roll.order.deadline,
      createdBy: roll.order.creator.name,
    },
    production: {
      machine: roll.machine?.name,
      machineStage: roll.machine?.stage,
      operator: productionLog?.operator?.name,
      shift: productionLog?.shift,
      productionDate: roll.productionDate,
      output: productionLog?.outputQuantity,
      waste: productionLog?.wasteQuantity,
    },
    rawMaterials: yarnUsed.map(movement => ({
      yarnType: movement.stockBatch.yarnType.name,
      yarnCount: movement.stockBatch.yarnType.count,
      color: movement.stockBatch.yarnType.color,
      lotNumber: movement.stockBatch.lotNumber,
      quantityUsed: movement.quantity,
      unitPrice: movement.stockBatch.unitPrice,
    })),
    qualityControl: roll.inspections.map(inspection => ({
      inspectionDate: inspection.inspectedAt,
      inspector: inspection.inspector.name,
      result: inspection.result,
      remarks: inspection.remarks,
      defects: inspection.defects.map(d => ({
        type: d.defectType,
        count: d.count,
        severity: d.severity,
        location: d.location,
      })),
    })),
    dispatch: roll.dispatchItems.length > 0 ? {
      dispatchNumber: roll.dispatchItems[0].dispatch.dispatchNumber,
      dispatchDate: roll.dispatchItems[0].dispatch.dispatchDate,
      vehicle: roll.dispatchItems[0].dispatch.vehicleNumber,
      driver: roll.dispatchItems[0].dispatch.driverName,
      buyer: roll.dispatchItems[0].dispatch.buyer?.name,
    } : null,
  };

  return traceability;
};

/**
 * Move passed roll to finished stock
 */
export const moveToFinishedStock = async (rollId, userId, location = 'WAREHOUSE') => {
  return await prisma.$transaction(async (tx) => {
    const roll = await tx.fabricRoll.findUnique({
      where: { id: rollId },
      select: { id: true, rollNumber: true, status: true },
    });

    if (!roll) {
      throw new Error('Fabric roll not found');
    }

    if (roll.status !== 'PASSED') {
      throw new Error(`Roll ${roll.rollNumber} must be in PASSED status. Current: ${roll.status}`);
    }

    // Validate status transition
    const validation = validateRollStatusTransition('PASSED', 'FINISHED_STOCK');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const updatedRoll = await tx.fabricRoll.update({
      where: { id: rollId },
      data: {
        status: 'FINISHED_STOCK',
        location,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
          },
        },
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'FabricRoll',
      entityId: rollId,
      oldValue: { status: 'PASSED' },
      newValue: { status: 'FINISHED_STOCK', location },
      notes: `Roll ${roll.rollNumber} moved to finished stock at ${location}`,
    });

    return updatedRoll;
  });
};

/**
 * Send rework roll back for re-production
 */
export const sendForRework = async (rollId, userId, reworkInstructions) => {
  return await prisma.$transaction(async (tx) => {
    const roll = await tx.fabricRoll.findUnique({
      where: { id: rollId },
      include: {
        order: { select: { orderNumber: true } },
        inspections: {
          where: { result: 'REWORK' },
          orderBy: { inspectedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!roll) {
      throw new Error('Fabric roll not found');
    }

    if (roll.status !== 'REWORK') {
      throw new Error(`Roll ${roll.rollNumber} must be in REWORK status. Current: ${roll.status}`);
    }

    // Validate transition
    const validation = validateRollStatusTransition('REWORK', 'AWAITING_QC');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update roll to AWAITING_QC for re-inspection after rework
    const updatedRoll = await tx.fabricRoll.update({
      where: { id: rollId },
      data: {
        status: 'AWAITING_QC',
        remarks: reworkInstructions || roll.inspections[0]?.remarks || 'Rework completed',
      },
    });

    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'FabricRoll',
      entityId: rollId,
      oldValue: { status: 'REWORK' },
      newValue: { status: 'AWAITING_QC' },
      notes: `Roll ${roll.rollNumber} sent for re-inspection after rework`,
    });

    return updatedRoll;
  });
};

/**
 * Override inspection result (authorized users only)
 */
export const overrideInspection = async (inspectionId, newResult, reason, userId) => {
  return await prisma.$transaction(async (tx) => {
    const inspection = await tx.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        roll: {
          select: { id: true, rollNumber: true, status: true },
        },
      },
    });

    if (!inspection) {
      throw new Error('Inspection not found');
    }

    // Validate new result has reason for rework/reject
    QualityRules.validateInspectionResult(newResult, reason);

    // Determine new roll status
    let newRollStatus;
    switch (newResult) {
      case 'PASS':
        newRollStatus = 'PASSED';
        break;
      case 'REWORK':
        newRollStatus = 'REWORK';
        break;
      case 'REJECT':
        newRollStatus = 'REJECTED';
        break;
      default:
        throw new Error(`Invalid inspection result: ${newResult}`);
    }

    // Update inspection
    const updatedInspection = await tx.inspection.update({
      where: { id: inspectionId },
      data: {
        result: newResult,
        remarks: `OVERRIDE: ${reason}`,
      },
    });

    // Update roll status
    await tx.fabricRoll.update({
      where: { id: inspection.roll.id },
      data: { status: newRollStatus },
    });

    // Comprehensive audit log
    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Inspection',
      entityId: inspectionId,
      oldValue: { result: inspection.result, rollStatus: inspection.roll.status },
      newValue: { result: newResult, rollStatus: newRollStatus },
      notes: `INSPECTION OVERRIDE for roll ${inspection.roll.rollNumber}: ${inspection.result} → ${newResult}. Reason: ${reason}`,
    });

    return updatedInspection;
  });
};
