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
    throw new Error(`Employee ID "${workerData.employeeId}" already exists`);
  }

  // Normalize dailyWage: if provided in rupees (< 20000), convert to integer paise
  let dailyWage = workerData.dailyWage;
  if (dailyWage !== undefined && dailyWage !== null) {
    dailyWage = Number(dailyWage);
    if (dailyWage > 0 && dailyWage <= 15000) {
      dailyWage = Math.round(dailyWage * 100);
    }
  }

  // Normalize joinDate
  let joinDate = workerData.joinDate ? new Date(workerData.joinDate) : new Date();

  // Normalize wageBasis
  let wageBasis = (workerData.wageBasis || 'DAILY').toUpperCase().replace('-', '_');
  if (wageBasis !== 'DAILY' && wageBasis !== 'PIECE_RATE') wageBasis = 'DAILY';

  return await prisma.worker.create({
    data: {
      ...workerData,
      wageBasis,
      dailyWage: dailyWage || 0,
      joinDate,
      department: workerData.department || 'Production',
      shift: workerData.shift || 'Morning',
      isActive: workerData.isActive !== undefined ? Boolean(workerData.isActive) : true,
    },
  });
};

export const getAllWorkers = async (filters = {}) => {
  const { isActive, wageBasis, department, search, page = 1, limit = 100 } = filters;
  
  const where = {};
  if (isActive !== undefined && isActive !== 'all') {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (wageBasis) where.wageBasis = wageBasis.toUpperCase();
  if (department && department !== 'ALL') where.department = department;

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { employeeId: { contains: q, mode: 'insensitive' } },
      { role: { contains: q, mode: 'insensitive' } },
      { department: { contains: q, mode: 'insensitive' } },
    ];
  }

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
  const worker = await prisma.worker.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
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
  const worker = await prisma.worker.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
  });
  if (!worker) {
    throw new Error('Worker not found');
  }

  // Normalize dailyWage if provided
  const data = { ...updateData };
  if (data.dailyWage !== undefined && data.dailyWage !== null) {
    let wage = Number(data.dailyWage);
    if (wage > 0 && wage <= 15000) {
      wage = Math.round(wage * 100);
    }
    data.dailyWage = wage;
  }
  if (data.wageBasis) {
    data.wageBasis = data.wageBasis.toUpperCase().replace('-', '_');
  }
  if (data.joinDate) {
    data.joinDate = new Date(data.joinDate);
  }

  return await prisma.worker.update({
    where: { id: worker.id },
    data,
  });
};

export const deleteWorker = async (id) => {
  const worker = await prisma.worker.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
    include: {
      _count: {
        select: {
          attendance: true,
          wageRecords: true,
        },
      },
    },
  });

  if (!worker) {
    throw new Error('Worker not found');
  }

  const hasHistory = worker._count.attendance > 0 || worker._count.wageRecords > 0;
  if (hasHistory) {
    // Safe deactivation to preserve historical records
    await prisma.worker.update({
      where: { id: worker.id },
      data: { isActive: false },
    });
    return {
      action: 'DEACTIVATED',
      message: `Worker ${worker.name} (${worker.employeeId}) has historical attendance/wage records and was safely deactivated.`,
      worker: { ...worker, isActive: false },
    };
  }

  await prisma.worker.delete({ where: { id: worker.id } });
  return {
    action: 'DELETED',
    message: `Worker ${worker.name} (${worker.employeeId}) deleted successfully`,
  };
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
    // Verify worker exists and is active
    const targetWorker = await tx.worker.findUnique({
      where: { id: normalizedAttendanceData.workerId },
    });
    if (!targetWorker) {
      throw new Error('Worker not found');
    }
    if (!targetWorker.isActive) {
      throw new Error(`Cannot mark attendance for deactivated worker "${targetWorker.name}"`);
    }

    // Role-based supervisor permission check:
    // A supervisor cannot mark attendance for another supervisor unless explicitly permitted in settings
    if (userId) {
      const actorUser = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (actorUser && actorUser.role === 'SUPERVISOR') {
        const isTargetSupervisor = targetWorker.role && targetWorker.role.toLowerCase().includes('supervisor');
        if (isTargetSupervisor) {
          const supervisorPermission = await tx.setting.findUnique({
            where: { key: 'ALLOW_SUPERVISOR_MARK_SUPERVISOR' },
          });
          const isAllowed = supervisorPermission?.value === 'true';
          if (!isAllowed) {
            throw new Error('Supervisors are not authorized to mark attendance for other supervisors without explicit administrative permission.');
          }
        }
      }
    }

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

    // Calculate base wage
    let baseWage = 0;
    if (worker.wageBasis === 'DAILY') {
      baseWage = Math.round((worker.dailyWage || 0) * payableDays);
    } else if (worker.wageBasis === 'PIECE_RATE') {
      // For piece rate, we'd need production data
      // Simplified here - would need actual piece count
      baseWage = Math.round((worker.pieceRate || 0) * payableDays * 10); // Example
    }

    // Add overtime (example: 1.5x daily rate per hour, all values in paise)
    const overtimeRate = Math.round(((worker.dailyWage || 0) / 8) * 1.5);
    const overtimePay = totalOvertime * overtimeRate;

    const deductions = 0; // Would be calculated based on company policy
    const netWage = baseWage + overtimePay - deductions;

    const baseWagePaise = Math.round(baseWage);
    const overtimePayPaise = Math.round(overtimePay);
    const deductionsPaise = Math.round(deductions);
    const netWagePaise = Math.round(netWage);

    // Validate wage calculation using business rules:
    // businessRules.validateWageCalculation expects baseWage + (overtimeHours * overtimeRate) - deductions === netWage
    AttendanceRules.validateWageCalculation(
      daysPresent,
      totalOvertime,
      baseWagePaise,
      deductionsPaise,
      netWagePaise,
      { overtimeRate }
    );

    // Validate money precision
    MoneyRules.validateMoney(baseWagePaise, 'grossWage');
    MoneyRules.validateMoney(deductionsPaise, 'deductions');
    MoneyRules.validateMoney(netWagePaise, 'netWage');

    wageRecords.push({
      workerId: worker.id,
      month,
      year,
      daysPresent,
      overtime: overtimePayPaise,
      grossWage: baseWagePaise,
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
  const { workerId, month, year, isLocked, page = 1, limit = 100 } = filters;
  
  const where = {};
  if (workerId) {
    where.OR = [
      { workerId: workerId },
      { worker: { employeeId: workerId } },
    ];
  }
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (isLocked !== undefined) where.isLocked = isLocked === 'true';

  const [records, total] = await Promise.all([
    prisma.wageRecord.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            role: true,
            department: true,
            wageBasis: true,
            dailyWage: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
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
