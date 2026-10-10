import { prisma } from '../config/database.js';
import { validateEntity, AttendanceRules, MoneyRules } from '../utils/businessRules.js';
import { audit, AUDIT_ACTIONS } from '../utils/audit.js';

// ============================================
// WORKERS
// ============================================

export const createWorker = async (workerData) => {
  // Check if employee ID already exists
  const existing = await prisma.worker.findUnique({
    where: { employeeId: workerData.employeeId },
  });

  if (existing) {
    throw new Error('Employee ID already exists');
  }

  return await prisma.worker.create({
    data: workerData,
  });
};

export const getAllWorkers = async (filters = {}) => {
  const { isActive, wageBasis, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (wageBasis) where.wageBasis = wageBasis;

  const [workers, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.worker.count({ where }),
  ]);

  return { workers, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getWorkerById = async (id) => {
  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      attendance: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      wageRecords: {
        orderBy: { year: 'desc', month: 'desc' },
        take: 12,
      },
    },
  });

  if (!worker) {
    throw new Error('Worker not found');
  }

  return worker;
};

export const getWorkerByEmployeeId = async (employeeId) => {
  const worker = await prisma.worker.findUnique({
    where: { employeeId },
  });

  if (!worker) {
    throw new Error('Worker not found');
  }

  return worker;
};

export const updateWorker = async (id, updateData) => {
  return await prisma.worker.update({
    where: { id },
    data: updateData,
  });
};

export const deleteWorker = async (id) => {
  await prisma.worker.delete({ where: { id } });
  return { message: 'Worker deleted successfully' };
};

// ============================================
// SHIFTS
// ============================================

export const createShift = async (shiftData) => {
  return await prisma.shift.create({
    data: shiftData,
  });
};

export const getAllShifts = async (filters = {}) => {
  const { isActive } = filters;
  
  const where = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';

  return await prisma.shift.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};

export const getShiftById = async (id) => {
  const shift = await prisma.shift.findUnique({
    where: { id },
  });

  if (!shift) {
    throw new Error('Shift not found');
  }

  return shift;
};

export const updateShift = async (id, updateData) => {
  return await prisma.shift.update({
    where: { id },
    data: updateData,
  });
};

export const deleteShift = async (id) => {
  await prisma.shift.delete({ where: { id } });
  return { message: 'Shift deleted successfully' };
};

// ============================================
// ATTENDANCE
// ============================================

export const markAttendance = async (attendanceData, userId = null) => {
  const normalizedAttendanceData = {
    ...attendanceData,
    date: new Date(attendanceData.date),
    checkInTime: attendanceData.checkInTime ? new Date(attendanceData.checkInTime) : undefined,
    checkOutTime: attendanceData.checkOutTime ? new Date(attendanceData.checkOutTime) : undefined,
    attendanceMethod: attendanceData.attendanceMethod || 'MANUAL',
  };

  return await prisma.$transaction(async (tx) => {
    // Check if attendance already exists for this worker, date, and shift
    const existing = await tx.attendance.findFirst({
      where: {
        workerId: normalizedAttendanceData.workerId,
        date: normalizedAttendanceData.date,
        shiftId: normalizedAttendanceData.shiftId,
      },
    });

    if (existing) {
      // Update existing attendance (idempotent)
      const updated = await tx.attendance.update({
        where: { id: existing.id },
        data: normalizedAttendanceData,
        include: {
          worker: { select: { name: true, employeeId: true } },
          shift: { select: { name: true } },
        },
      });

      // Audit the update
      if (userId) {
        await audit({
          userId,
          action: AUDIT_ACTIONS.UPDATE,
          entity: 'Attendance',
          entityId: updated.id,
          notes: `Updated attendance for worker ${updated.worker.employeeId} - ${updated.worker.name}`,
          metadata: {
            workerId: updated.workerId,
            date: updated.date,
            shiftId: updated.shiftId,
            status: updated.status,
            overtimeHours: updated.overtimeHours,
          }
        });
      }

      return updated;
    }

    // Validate uniqueness using business rules (will throw if duplicate)
    await AttendanceRules.validateAttendanceUniqueness(
      normalizedAttendanceData.workerId,
      normalizedAttendanceData.date,
      normalizedAttendanceData.shiftId
    );

    // Create new attendance
    const created = await tx.attendance.create({
      data: normalizedAttendanceData,
      include: {
        worker: { select: { name: true, employeeId: true } },
        shift: { select: { name: true } },
      },
    });

    // Audit the creation
    if (userId) {
      await audit({
        userId,
        action: AUDIT_ACTIONS.CREATE,
        entity: 'Attendance',
        entityId: created.id,
        notes: `Marked attendance for worker ${created.worker.employeeId} - ${created.worker.name}`,
        metadata: {
          workerId: created.workerId,
          date: created.date,
          shiftId: created.shiftId,
          status: created.status,
          overtimeHours: created.overtimeHours,
        }
      });
    }

    return created;
  });
};

export const bulkMarkAttendance = async (attendanceRecords, userId = null) => {
  const results = [];
  
  for (const record of attendanceRecords) {
    try {
      const attendance = await markAttendance(
        { attendanceMethod: 'BULK_UPLOAD', ...record },
        userId
      );
      results.push({ success: true, attendance });
    } catch (error) {
      results.push({ success: false, error: error.message, data: record });
    }
  }

  // Audit bulk operation summary
  if (userId) {
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    await audit({
      userId,
      action: AUDIT_ACTIONS.BULK_OPERATION,
      entity: 'Attendance',
      entityId: null,
      notes: `Bulk attendance marking: ${successCount} succeeded, ${failureCount} failed`,
      metadata: {
        totalRecords: attendanceRecords.length,
        successCount,
        failureCount,
        failures: results.filter(r => !r.success).map(r => ({
          workerId: r.data?.workerId,
          error: r.error
        }))
      }
    });
  }

  return results;
};

export const getAllAttendance = async (filters = {}) => {
  const { workerId, shiftId, date, startDate, endDate, status, page = 1, limit = 100 } = filters;
  
  const where = {};
  if (workerId) where.workerId = workerId;
  if (shiftId) where.shiftId = shiftId;
  if (status) where.status = status;
  
  if (date) {
    const targetDate = new Date(date);
    where.date = {
      gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      lte: new Date(targetDate.setHours(23, 59, 59, 999)),
    };
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        worker: { select: { name: true, employeeId: true } },
        shift: { select: { name: true } },
        correctedByUser: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { attendance, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getAttendanceById = async (id) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      worker: true,
      shift: true,
      correctedByUser: { select: { name: true, email: true } },
    },
  });

  if (!attendance) {
    throw new Error('Attendance record not found');
  }

  return attendance;
};

export const updateAttendance = async (id, updateData, correctedBy, userId = null) => {
  const actorId = userId || correctedBy;
  // Get original attendance record
  const original = await prisma.attendance.findUnique({
    where: { id },
    include: {
      worker: { select: { name: true, employeeId: true } },
      shift: { select: { name: true } }
    }
  });

  if (!original) {
    throw new Error('Attendance record not found');
  }

  // Validate correction if status or key fields changed
  if (original.status !== updateData.status || 
      original.overtimeHours !== updateData.overtimeHours) {
    AttendanceRules.validateAttendanceCorrection(
      original.status,
      updateData.status || original.status,
      updateData.correctionReason,
      correctedBy
    );
  }

  // Update with correction metadata
  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      ...updateData,
      correctedBy,
      correctedAt: new Date(),
    },
    include: {
      worker: { select: { name: true, employeeId: true } },
      shift: { select: { name: true } },
      correctedByUser: { select: { name: true } }
    },
  });

  // Audit the correction
  if (actorId) {
    await audit({
      userId: actorId,
      action: AUDIT_ACTIONS.ATTENDANCE_CORRECTION,
      entity: 'Attendance',
      entityId: updated.id,
      notes: `Corrected attendance for ${updated.worker.employeeId} - ${updated.worker.name}: ${updateData.correctionReason}`,
      metadata: {
        originalStatus: original.status,
        newStatus: updated.status,
        originalOvertime: original.overtimeHours,
        newOvertime: updated.overtimeHours,
        correctionReason: updateData.correctionReason,
        correctedBy,
        date: updated.date,
        shiftId: updated.shiftId
      }
    });
  }

  return updated;
};

// Get attendance summary for a date range
export const getAttendanceSummary = async (filters = {}) => {
  const { workerId, startDate, endDate } = filters;

  const where = {};
  if (workerId) where.workerId = workerId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      worker: { select: { name: true, employeeId: true } },
    },
  });

  // Group by worker
  const summary = attendance.reduce((acc, record) => {
    const key = record.workerId;
    if (!acc[key]) {
      acc[key] = {
        worker: record.worker,
        present: 0,
        absent: 0,
        halfDay: 0,
        leave: 0,
        totalOvertime: 0,
      };
    }

    switch (record.status) {
      case 'PRESENT':
        acc[key].present += 1;
        break;
      case 'ABSENT':
        acc[key].absent += 1;
        break;
      case 'HALF_DAY':
        acc[key].halfDay += 1;
        break;
      case 'LEAVE':
        acc[key].leave += 1;
        break;
    }

    acc[key].totalOvertime += record.overtimeHours;
    return acc;
  }, {});

  return Object.values(summary);
};

// ============================================
// WAGE RECORDS
// ============================================

export const generateWageSheet = async (month, year, userId = null) => {
  // Get all active workers
  const workers = await prisma.worker.findMany({
    where: { isActive: true },
  });

  const wageRecords = [];

  for (const worker of workers) {
    // Get attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        workerId: worker.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const payableDays = attendance.reduce((sum, a) => {
      if (a.status === 'PRESENT') return sum + 1;
      if (a.status === 'HALF_DAY') return sum + 0.5;
      return sum;
    }, 0);
    const daysPresent = attendance.filter(
      (a) => a.status === 'PRESENT' || a.status === 'HALF_DAY'
    ).length;

    const totalOvertime = attendance.reduce((sum, a) => sum + a.overtimeHours, 0);

    // Calculate gross wage
    let grossWage = 0;
    if (worker.wageBasis === 'DAILY') {
      grossWage = Math.round((worker.dailyWage || 0) * payableDays);
    } else if (worker.wageBasis === 'PIECE_RATE') {
      // For piece rate, we'd need production data
      // Simplified here - would need actual piece count
      grossWage = Math.round((worker.pieceRate || 0) * payableDays * 10); // Example
    }

    // Add overtime (example: 1.5x daily rate per hour, all values in paise)
    const overtimeRate = Math.round(((worker.dailyWage || 0) / 8) * 1.5);
    const overtimePay = totalOvertime * overtimeRate;
    grossWage += overtimePay;

    const deductions = 0; // Would be calculated based on company policy
    const netWage = grossWage - deductions;

    // Wages are already stored as integer paise.
    const grossWagePaise = Math.round(grossWage);
    const deductionsPaise = Math.round(deductions);
    const netWagePaise = Math.round(netWage);

    // Validate wage calculation using business rules
    AttendanceRules.validateWageCalculation(
      daysPresent,
      totalOvertime,
      grossWagePaise,
      deductionsPaise,
      netWagePaise,
      { overtimeRate: MoneyRules.rupeesToPaise(overtimeRate) }
    );

    // Validate money precision
    MoneyRules.validateMoney(grossWagePaise, 'grossWage');
    MoneyRules.validateMoney(deductionsPaise, 'deductions');
    MoneyRules.validateMoney(netWagePaise, 'netWage');

    wageRecords.push({
      workerId: worker.id,
      month,
      year,
      daysPresent,
      overtime: totalOvertime,
      grossWage: grossWagePaise,
      deductions: deductionsPaise,
      netWage: netWagePaise,
      isLocked: false,
    });
  }

  // Create wage records in database
  await prisma.wageRecord.createMany({
    data: wageRecords,
    skipDuplicates: true,
  });

  // Fetch created records with worker details
  const createdRecords = await prisma.wageRecord.findMany({
    where: {
      month,
      year,
    },
    include: {
      worker: { select: { name: true, employeeId: true, wageBasis: true } },
    },
  });

  // Audit wage sheet generation
  if (userId) {
    const totalWages = wageRecords.reduce((sum, r) => sum + r.netWage, 0);
    await audit({
      userId,
      action: AUDIT_ACTIONS.WAGE_SHEET_GENERATED,
      entity: 'WageRecord',
      entityId: null,
      notes: `Generated wage sheet for ${month}/${year} - ${wageRecords.length} workers`,
      metadata: {
        month,
        year,
        workerCount: wageRecords.length,
        payableDaysBasis: 'PRESENT=1, HALF_DAY=0.5',
        totalGrossWagePaise: wageRecords.reduce((sum, r) => sum + r.grossWage, 0),
        totalNetWagePaise: totalWages,
        totalNetWageRupees: MoneyRules.paiseToRupees(totalWages)
      }
    });
  }

  return createdRecords;
};

export const getAllWageRecords = async (filters = {}) => {
  const { workerId, month, year, isLocked, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (workerId) where.workerId = workerId;
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (isLocked !== undefined) where.isLocked = isLocked === 'true';

  const [records, total] = await Promise.all([
    prisma.wageRecord.findMany({
      where,
      include: {
        worker: { select: { name: true, employeeId: true, wageBasis: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    }),
    prisma.wageRecord.count({ where }),
  ]);

  return { records, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getWageRecordById = async (id) => {
  const record = await prisma.wageRecord.findUnique({
    where: { id },
    include: {
      worker: true,
    },
  });

  if (!record) {
    throw new Error('Wage record not found');
  }

  return record;
};

export const updateWageRecord = async (id, updateData, userId = null) => {
  const record = await prisma.wageRecord.findUnique({
    where: { id },
    include: {
      worker: { select: { name: true, employeeId: true } }
    }
  });

  if (!record) {
    throw new Error('Wage record not found');
  }

  // Validate locked status - cannot update locked records
  AttendanceRules.validateWageSheetLock(record.isLocked, true);

  // Validate money fields if provided
  if (updateData.grossWage !== undefined) {
    MoneyRules.validateMoney(updateData.grossWage, 'grossWage');
  }
  if (updateData.deductions !== undefined) {
    MoneyRules.validateMoney(updateData.deductions, 'deductions');
  }
  if (updateData.netWage !== undefined) {
    MoneyRules.validateMoney(updateData.netWage, 'netWage');
  }

  const updated = await prisma.wageRecord.update({
    where: { id },
    data: updateData,
    include: {
      worker: { select: { name: true, employeeId: true } },
    },
  });

  // Audit the update
  if (userId) {
    await audit({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'WageRecord',
      entityId: updated.id,
      notes: `Updated wage record for ${updated.worker.employeeId} - ${updated.worker.name} (${updated.month}/${updated.year})`,
      metadata: {
        workerId: updated.workerId,
        month: updated.month,
        year: updated.year,
        originalGrossWage: record.grossWage,
        newGrossWage: updated.grossWage,
        originalNetWage: record.netWage,
        newNetWage: updated.netWage
      }
    });
  }

  return updated;
};

export const lockWageRecord = async (id, userId = null) => {
  const record = await prisma.wageRecord.findUnique({
    where: { id },
    include: {
      worker: { select: { name: true, employeeId: true } }
    }
  });

  if (!record) {
    throw new Error('Wage record not found');
  }

  if (record.isLocked) {
    throw new Error('Wage record is already locked');
  }

  const updated = await prisma.wageRecord.update({
    where: { id },
    data: { isLocked: true },
    include: {
      worker: { select: { name: true, employeeId: true } },
    },
  });

  // Audit the lock operation
  if (userId) {
    await audit({
      userId,
      action: AUDIT_ACTIONS.WAGE_SHEET_LOCKED,
      entity: 'WageRecord',
      entityId: updated.id,
      notes: `Locked wage record for ${updated.worker.employeeId} - ${updated.worker.name} (${updated.month}/${updated.year})`,
      metadata: {
        workerId: updated.workerId,
        month: updated.month,
        year: updated.year,
        netWage: updated.netWage,
        netWageRupees: MoneyRules.paiseToRupees(updated.netWage)
      }
    });
  }

  return updated;
};

export const unlockWageRecord = async (id, reason, userId = null) => {
  const record = await prisma.wageRecord.findUnique({
    where: { id },
    include: {
      worker: { select: { name: true, employeeId: true } }
    }
  });

  if (!record) {
    throw new Error('Wage record not found');
  }

  if (!record.isLocked) {
    throw new Error('Wage record is not locked');
  }

  // Require reason for unlocking (controlled reopening)
  if (!reason || reason.trim().length === 0) {
    throw new Error('Reason is required to unlock wage record');
  }

  const updated = await prisma.wageRecord.update({
    where: { id },
    data: { isLocked: false },
    include: {
      worker: { select: { name: true, employeeId: true } },
    },
  });

  // Audit the unlock operation with reason
  if (userId) {
    await audit({
      userId,
      action: AUDIT_ACTIONS.WAGE_SHEET_UNLOCKED,
      entity: 'WageRecord',
      entityId: updated.id,
      notes: `Unlocked wage record for ${updated.worker.employeeId} - ${updated.worker.name} (${updated.month}/${updated.year}). Reason: ${reason}`,
      metadata: {
        workerId: updated.workerId,
        month: updated.month,
        year: updated.year,
        unlockReason: reason,
        netWage: updated.netWage
      }
    });
  }

  return updated;
};
