import { prisma } from '../config/database.js';
import { validateMachineStatusTransition } from '../utils/statusLifecycles.js';

// ============================================
// MACHINES
// ============================================

export const createMachine = async (machineData) => {
  return await prisma.machine.create({
    data: machineData,
  });
};

export const getAllMachines = async (filters = {}) => {
  const { stage, status, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (stage) where.stage = stage;
  if (status) where.status = status;

  const [machines, total] = await Promise.all([
    prisma.machine.findMany({
      where,
      include: {
        workAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            order: {
              select: {
                orderNumber: true,
                buyer: { select: { name: true } },
              },
            },
          },
          take: 1,
        },
        _count: {
          select: {
            productionLogs: true,
            downtimeLogs: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.machine.count({ where }),
  ]);

  return { machines, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getMachineById = async (id) => {
  const machine = await prisma.machine.findUnique({
    where: { id },
    include: {
      workAssignments: {
        include: {
          order: {
            select: {
              orderNumber: true,
              buyer: { select: { name: true } },
              fabricType: { select: { name: true } },
            },
          },
          assignedByUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      productionLogs: {
        include: {
          operator: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 20,
      },
      downtimeLogs: {
        orderBy: { startTime: 'desc' },
        take: 10,
      },
    },
  });

  if (!machine) {
    throw new Error('Machine not found');
  }

  return machine;
};

export const updateMachine = async (id, updateData) => {
  return await prisma.machine.update({
    where: { id },
    data: updateData,
  });
};

export const updateMachineStatus = async (id, status) => {
  // Get current machine status
  const currentMachine = await prisma.machine.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!currentMachine) {
    throw new Error('Machine not found');
  }

  // Validate status transition
  const validation = validateMachineStatusTransition(currentMachine.status, status);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return await prisma.machine.update({
    where: { id },
    data: { status },
  });
};

export const deleteMachine = async (id) => {
  await prisma.machine.delete({ where: { id } });
  return { message: 'Machine deleted successfully' };
};

// Get machine board (dashboard view)
export const getMachineBoard = async (filters = {}) => {
  const { stage } = filters;
  
  const where = {};
  if (stage) where.stage = stage;

  const machines = await prisma.machine.findMany({
    where,
    include: {
      workAssignments: {
        where: { status: 'ACTIVE' },
        include: {
          order: {
            select: {
              orderNumber: true,
              buyer: { select: { name: true } },
              color: true,
            },
          },
        },
        take: 1,
      },
    },
    orderBy: [{ stage: 'asc' }, { name: 'asc' }],
  });

  // Get today's production for each machine
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayProduction = await prisma.productionLog.groupBy({
    by: ['machineId'],
    where: {
      date: { gte: today },
    },
    _sum: {
      outputQuantity: true,
    },
  });

  const productionMap = new Map(
    todayProduction.map((p) => [p.machineId, p._sum.outputQuantity || 0])
  );

  // Combine data
  const machineBoard = machines.map((machine) => ({
    ...machine,
    todayOutput: productionMap.get(machine.id) || 0,
    activeAssignment: machine.workAssignments[0] || null,
  }));

  return machineBoard;
};

// ============================================
// WORK ASSIGNMENTS
// ============================================

export const createWorkAssignment = async (assignmentData) => {
  return await prisma.$transaction(async (tx) => {
    // Check if machine is available
    const machine = await tx.machine.findUnique({
      where: { id: assignmentData.machineId },
      include: {
        workAssignments: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!machine) {
      throw new Error('Machine not found');
    }

    if (machine.status === 'BREAKDOWN' || machine.status === 'MAINTENANCE') {
      throw new Error(`Machine is ${machine.status.toLowerCase()} and cannot be assigned work`);
    }

    if (machine.workAssignments.length > 0) {
      throw new Error('Machine already has an active work assignment');
    }

    // Create assignment
    const assignment = await tx.workAssignment.create({
      data: assignmentData,
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
          },
        },
        machine: { select: { name: true, stage: true } },
      },
    });

    // Update machine status to RUNNING
    await tx.machine.update({
      where: { id: assignmentData.machineId },
      data: { status: 'RUNNING' },
    });

    // Update order status if needed
    await tx.order.update({
      where: { id: assignmentData.orderId },
      data: {
        status: 'IN_PRODUCTION',
      },
    });

    return assignment;
  });
};

export const getAllWorkAssignments = async (filters = {}) => {
  const { orderId, machineId, status, page = 1, limit = 50 } = filters;
  
  const where = {};
  if (orderId) where.orderId = orderId;
  if (machineId) where.machineId = machineId;
  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.workAssignment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            buyer: { select: { name: true } },
          },
        },
        machine: { select: { name: true, stage: true } },
        assignedByUser: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workAssignment.count({ where }),
  ]);

  return { assignments, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getWorkAssignmentById = async (id) => {
  const assignment = await prisma.workAssignment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          buyer: { select: { name: true } },
          fabricType: true,
        },
      },
      machine: true,
      assignedByUser: { select: { name: true, email: true } },
      productionLogs: {
        include: {
          operator: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      },
      fabricRolls: {
        select: {
          id: true,
          rollNumber: true,
          length: true,
          status: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error('Work assignment not found');
  }

  return assignment;
};

export const updateWorkAssignment = async (id, updateData) => {
  return await prisma.workAssignment.update({
    where: { id },
    data: updateData,
    include: {
      order: {
        select: {
          orderNumber: true,
          buyer: { select: { name: true } },
        },
      },
      machine: { select: { name: true } },
    },
  });
};

export const completeWorkAssignment = async (id) => {
  return await prisma.$transaction(async (tx) => {
    const assignment = await tx.workAssignment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
      include: {
        machine: true,
      },
    });

    // Update machine status to IDLE
    await tx.machine.update({
      where: { id: assignment.machineId },
      data: { status: 'IDLE' },
    });

    return assignment;
  });
};

// ============================================
// PRODUCTION LOGS
// ============================================

export const createProductionLog = async (logData) => {
  const outputQuantity = Number(logData.outputQuantity ?? logData.output ?? 0);
  const wasteQuantity = Number(logData.wasteQuantity ?? logData.waste ?? 0);
  const normalizedLogData = {
    ...logData,
    date: new Date(logData.date),
    outputQuantity,
    wasteQuantity,
  };
  delete normalizedLogData.output;
  delete normalizedLogData.waste;

  if (outputQuantity < 0 || wasteQuantity < 0) {
    throw new Error('Production output and waste cannot be negative');
  }

  return await prisma.$transaction(async (tx) => {
    // Create production log
    const log = await tx.productionLog.create({
      data: normalizedLogData,
      include: {
        machine: { select: { name: true, stage: true } },
        operator: { select: { name: true } },
      },
    });

    // Generate fabric rolls if output is significant
    if (outputQuantity > 0 && normalizedLogData.workAssignmentId) {
      const rollCount = Math.floor(outputQuantity / 50); // Assuming 50 meters per roll
      
      if (rollCount > 0) {
        const assignment = await tx.workAssignment.findUnique({
          where: { id: logData.workAssignmentId },
        });

        if (!assignment) {
          throw new Error('Work assignment not found for roll generation');
        }

        const rollsToCreate = [];
        for (let i = 0; i < rollCount; i++) {
          const rollNumber = `EVR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`;
          
          rollsToCreate.push({
            rollNumber,
            orderId: assignment.orderId,
            machineId: normalizedLogData.machineId,
            workAssignmentId: normalizedLogData.workAssignmentId,
            length: 50,
            productionDate: normalizedLogData.date,
            status: 'AWAITING_QC',
          });
        }

        await tx.fabricRoll.createMany({
          data: rollsToCreate,
        });
      }
    }

    return log;
  });
};

export const getAllProductionLogs = async (filters = {}) => {
  const { machineId, orderId, date, shift, page = 1, limit = 100 } = filters;
  
  const where = {};
  if (machineId) where.machineId = machineId;
  if (orderId) where.orderId = orderId;
  if (shift) where.shift = shift;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    where.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.productionLog.findMany({
      where,
      include: {
        machine: { select: { name: true, stage: true } },
        operator: { select: { name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.productionLog.count({ where }),
  ]);

  return { logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getProductionLogById = async (id) => {
  const log = await prisma.productionLog.findUnique({
    where: { id },
    include: {
      machine: true,
      operator: { select: { name: true, email: true } },
      workAssignment: {
        include: {
          order: {
            select: {
              orderNumber: true,
              buyer: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!log) {
    throw new Error('Production log not found');
  }

  return log;
};

// ============================================
// DOWNTIME LOGS
// ============================================

export const createDowntimeLog = async (downtimeData) => {
  return await prisma.$transaction(async (tx) => {
    // Create downtime log
    const downtime = await tx.downtimeLog.create({
      data: downtimeData,
      include: {
        machine: { select: { name: true, stage: true } },
      },
    });

    // Update machine status to BREAKDOWN
    await tx.machine.update({
      where: { id: downtimeData.machineId },
      data: { status: 'BREAKDOWN' },
    });

    return downtime;
  });
};

export const getAllDowntimeLogs = async (filters = {}) => {
  const { machineId, page = 1, limit = 100 } = filters;
  
  const where = {};
  if (machineId) where.machineId = machineId;

  const [logs, total] = await Promise.all([
    prisma.downtimeLog.findMany({
      where,
      include: {
        machine: { select: { name: true, stage: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startTime: 'desc' },
    }),
    prisma.downtimeLog.count({ where }),
  ]);

  return { logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } };
};

export const getDowntimeLogById = async (id) => {
  const log = await prisma.downtimeLog.findUnique({
    where: { id },
    include: {
      machine: true,
    },
  });

  if (!log) {
    throw new Error('Downtime log not found');
  }

  return log;
};

export const updateDowntimeLog = async (id, updateData) => {
  return await prisma.$transaction(async (tx) => {
    const downtime = await tx.downtimeLog.update({
      where: { id },
      data: updateData,
      include: {
        machine: { select: { name: true } },
      },
    });

    // If endTime is set and machine is still in BREAKDOWN, change to IDLE
    if (updateData.endTime) {
      const machine = await tx.machine.findUnique({
        where: { id: downtime.machineId },
      });

      if (machine.status === 'BREAKDOWN') {
        await tx.machine.update({
          where: { id: downtime.machineId },
          data: { status: 'IDLE' },
        });
      }
    }

    return downtime;
  });
};
