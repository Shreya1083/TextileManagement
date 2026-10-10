import { prisma } from '../config/database.js';
import { generateQRCode, generateRollQRData, generateAttendanceQRData } from '../utils/qrcode.js';
import crypto from 'crypto';

// ============================================
// FABRIC ROLL QR - Generate QR for a roll
// ============================================

export const getOrGenerateRollQR = async (rollId) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { id: rollId },
    include: {
      order: {
        select: {
          orderNumber: true,
          buyer: { select: { name: true } },
          fabricType: { select: { name: true } },
        },
      },
      machine: { select: { name: true, stage: true } },
    },
  });

  if (!roll) throw new Error('Fabric roll not found');

  // If QR already generated, return it
  if (roll.qrCode) {
    return { roll, qrCode: roll.qrCode };
  }

  // Generate opaque QR data (only roll identifier, no confidential business data)
  const qrPayload = generateRollQRData(roll.rollNumber);
  const qrDataURL = await generateQRCode(qrPayload);

  // Save QR to roll record
  const updatedRoll = await prisma.fabricRoll.update({
    where: { id: rollId },
    data: { qrCode: qrDataURL },
  });

  return { roll: updatedRoll, qrCode: qrDataURL };
};

// ============================================
// ROLL SCAN - look up roll by scanning QR
// ============================================

export const scanRollQR = async (rollNumber) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { rollNumber },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
          deadline: true,
          buyer: { select: { id: true, name: true } },
          fabricType: { select: { name: true } },
        },
      },
      machine: { select: { name: true, stage: true } },
      workAssignment: {
        select: {
          stage: true,
          plannedQuantity: true,
          startDate: true,
        },
      },
      inspections: {
        orderBy: { inspectedAt: 'desc' },
        take: 1,
        select: {
          result: true,
          grade: true,
          remarks: true,
          inspectedAt: true,
          inspector: { select: { name: true } },
        },
      },
      dispatchItems: {
        select: {
          dispatch: {
            select: {
              dispatchNumber: true,
              dispatchDate: true,
            },
          },
        },
      },
    },
  });

  if (!roll) throw new Error('Fabric roll not found for this QR code');

  return roll;
};

// ============================================
// ATTENDANCE SESSION QR
// ============================================

export const createAttendanceSession = async (shiftId, createdBy, validMinutes = 60) => {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
  if (!shift) throw new Error('Shift not found');
  if (!shift.isActive) throw new Error('Shift is not active');

  // Deactivate any existing active sessions for this shift today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await prisma.attendanceSession.updateMany({
    where: {
      shiftId,
      createdAt: { gte: today, lt: tomorrow },
      isActive: true,
    },
    data: { isActive: false },
  });

  const sessionCode = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000);

  const session = await prisma.attendanceSession.create({
    data: {
      shiftId,
      sessionCode,
      date: new Date(),
      expiresAt,
      createdBy,
      isActive: true,
    },
    include: { shift: true },
  });

  // Generate QR code image
  const qrPayload = generateAttendanceQRData(session.sessionCode, shiftId, expiresAt.toISOString());
  const qrDataURL = await generateQRCode(qrPayload);

  return { session, qrCode: qrDataURL, expiresAt };
};

export const getActiveAttendanceSession = async (shiftId) => {
  const session = await prisma.attendanceSession.findFirst({
    where: {
      shiftId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: { shift: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!session) throw new Error('No active attendance session for this shift');

  const qrPayload = generateAttendanceQRData(session.sessionCode, shiftId, session.expiresAt.toISOString());
  const qrDataURL = await generateQRCode(qrPayload);

  return { session, qrCode: qrDataURL };
};

// ============================================
// QR ATTENDANCE SCAN
// ============================================

export const processQRAttendanceScan = async (sessionCode, workerId) => {
  let resolvedSessionCode = sessionCode;

  if (typeof sessionCode === 'string' && sessionCode.trim().startsWith('{')) {
    try {
      const payload = JSON.parse(sessionCode);
      resolvedSessionCode = payload.sessionCode;
    } catch {
      throw new Error('Invalid attendance QR payload');
    }
  }

  if (!resolvedSessionCode) {
    throw new Error('Attendance session code is required');
  }

  // Find and validate session
  const session = await prisma.attendanceSession.findUnique({
    where: { sessionCode: resolvedSessionCode },
    include: { shift: true },
  });

  if (!session) throw new Error('Invalid attendance session code');
  if (!session.isActive) throw new Error('Attendance session is no longer active');
  if (new Date() > session.expiresAt) throw new Error('Attendance session has expired');

  // Find worker
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw new Error('Worker not found');
  if (!worker.isActive) throw new Error('Worker account is deactivated');

  // Check for duplicate attendance (idempotent)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: {
      workerId,
      shiftId: session.shiftId,
      date: { gte: today, lt: tomorrow },
    },
  });

  if (existing) {
    return { attendance: existing, message: 'Attendance already recorded for this shift today', isDuplicate: true };
  }

  // Create attendance record
  const attendance = await prisma.attendance.create({
    data: {
      workerId,
      shiftId: session.shiftId,
      date: new Date(),
      status: 'PRESENT',
      checkInTime: new Date(),
      attendanceMethod: 'QR',
    },
    include: {
      worker: { select: { name: true, employeeId: true } },
      shift: { select: { name: true } },
    },
  });

  return { attendance, message: 'Attendance recorded successfully', isDuplicate: false };
};

// ============================================
// ROLL TRACEABILITY (full history)
// ============================================

export const getRollTraceability = async (rollNumber) => {
  const roll = await prisma.fabricRoll.findUnique({
    where: { rollNumber },
    include: {
      order: {
        include: {
          buyer: { select: { id: true, name: true, contactName: true } },
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
        orderBy: { inspectedAt: 'asc' },
        include: {
          defects: true,
          inspector: { select: { name: true } },
        },
      },
      dispatchItems: {
        include: {
          dispatch: {
            include: {
              buyer: { select: { name: true } },
              invoice: {
                select: {
                  invoiceNumber: true,
                  totalAmount: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!roll) throw new Error('Fabric roll not found');

  // Build timeline
  const timeline = [
    {
      event: 'PRODUCED',
      timestamp: roll.createdAt,
      details: `Produced on machine ${roll.machine?.name ?? 'Unknown'}, Assignment: ${roll.workAssignment?.stage ?? 'N/A'}`,
    },
  ];

  for (const inspection of roll.inspections) {
    timeline.push({
      event: `QC_${inspection.result}`,
      timestamp: inspection.inspectedAt,
      details: `Inspector: ${inspection.inspector.name}, Result: ${inspection.result}, Grade: ${inspection.grade ?? 'N/A'}`,
      defects: inspection.defects,
    });
  }

  if (roll.status === 'FINISHED_STOCK' || roll.status === 'DISPATCHED') {
    timeline.push({
      event: 'MOVED_TO_STOCK',
      timestamp: roll.updatedAt,
      details: `Location: ${roll.location ?? 'Warehouse'}`,
    });
  }

  if (roll.dispatchItems.length > 0) {
    for (const item of roll.dispatchItems) {
      timeline.push({
        event: 'DISPATCHED',
        timestamp: item.dispatch.dispatchDate,
        details: `Dispatch: ${item.dispatch.dispatchNumber}, Buyer: ${item.dispatch.buyer?.name}`,
      });
    }
  }

  return { roll, timeline };
};
