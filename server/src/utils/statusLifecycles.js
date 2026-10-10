// Status Lifecycle Management
// Enforces valid state transitions according to business rules

// Order Status Lifecycle
// DRAFT -> CONFIRMED -> YARN_PENDING -> IN_PRODUCTION -> QUALITY_CHECK -> READY_TO_SHIP -> DISPATCHED -> CLOSED

export const ORDER_STATUS_TRANSITIONS = {
  DRAFT: ['CONFIRMED', 'YARN_PENDING', 'CANCELLED'],
  CONFIRMED: ['YARN_PENDING', 'IN_PRODUCTION', 'CANCELLED'],
  YARN_PENDING: ['IN_PRODUCTION', 'CONFIRMED', 'CANCELLED'],
  IN_PRODUCTION: ['QUALITY_CHECK', 'CANCELLED'],
  QUALITY_CHECK: ['READY_TO_SHIP', 'IN_PRODUCTION', 'CANCELLED'],
  READY_TO_SHIP: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['CLOSED'],
  CLOSED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export const validateOrderStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
};

// Machine Status Lifecycle
// IDLE -> RUNNING -> BREAKDOWN -> MAINTENANCE -> IDLE

export const MACHINE_STATUS_TRANSITIONS = {
  IDLE: ['RUNNING', 'MAINTENANCE'],
  RUNNING: ['IDLE', 'BREAKDOWN'],
  BREAKDOWN: ['MAINTENANCE', 'IDLE'],
  MAINTENANCE: ['IDLE'],
};

export const validateMachineStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = MACHINE_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
};

// Roll Status Lifecycle
// PRODUCED -> AWAITING_QC -> (PASSED | REWORK | REJECTED)
// PASSED -> FINISHED_STOCK -> DISPATCHED
// REWORK -> AWAITING_QC (after re-production)

export const ROLL_STATUS_TRANSITIONS = {
  PRODUCED: ['AWAITING_QC'],
  AWAITING_QC: ['PASSED', 'REWORK', 'REJECTED'],
  PASSED: ['FINISHED_STOCK'],
  REWORK: ['AWAITING_QC'], // After re-work
  REJECTED: [], // Terminal state
  FINISHED_STOCK: ['DISPATCHED'],
  DISPATCHED: [], // Terminal state
};

export const validateRollStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = ROLL_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
};

// Purchase Order Status Lifecycle
// RAISED -> PARTIALLY_RECEIVED -> RECEIVED

export const PO_STATUS_TRANSITIONS = {
  RAISED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export const validatePOStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = PO_STATUS_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions.join(', ')}`,
    };
  }

  return { valid: true };
};

// Helper function to get status description
export const getStatusDescription = (entity, status) => {
  const descriptions = {
    order: {
      DRAFT: 'Order is being drafted',
      CONFIRMED: 'Order confirmed, awaiting yarn availability',
      YARN_PENDING: 'Waiting for yarn to be available',
      IN_PRODUCTION: 'Order is currently in production',
      QUALITY_CHECK: 'Fabric rolls are undergoing quality inspection',
      READY_TO_SHIP: 'Order completed and ready for dispatch',
      DISPATCHED: 'Order has been dispatched to buyer',
      CLOSED: 'Order completed and closed',
      CANCELLED: 'Order cancelled',
    },
    machine: {
      IDLE: 'Machine is idle and available',
      RUNNING: 'Machine is currently running production',
      BREAKDOWN: 'Machine has broken down',
      MAINTENANCE: 'Machine is under maintenance',
    },
    roll: {
      PRODUCED: 'Roll has been produced',
      AWAITING_QC: 'Roll is awaiting quality inspection',
      PASSED: 'Roll passed quality inspection',
      REWORK: 'Roll needs rework',
      REJECTED: 'Roll rejected due to quality issues',
      FINISHED_STOCK: 'Roll is in finished goods stock',
      DISPATCHED: 'Roll has been dispatched',
    },
    po: {
      RAISED: 'Purchase order has been raised',
      PARTIALLY_RECEIVED: 'Purchase order partially received',
      RECEIVED: 'Purchase order fully received',
      CANCELLED: 'Purchase order cancelled',
    },
  };

  return descriptions[entity]?.[status] || status;
};
