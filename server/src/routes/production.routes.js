import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/downtime', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        { machine: 'Loom-04', reason: 'Motor fault', duration: '1h 15m', time: '10:15 AM' },
        { machine: 'Spin-02', reason: 'Thread break', duration: '20m', time: '02:30 PM' },
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderId, operatorId } = req.body;
    
    // Find machine by ID or machineId
    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineId: id }] }
    });

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${id} not found` });
    }

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        status: 'RUNNING',
        order: orderId || machine.order || null,
        operator: operatorId || machine.operator || null,
      }
    });

    res.json({ success: true, message: `Machine ${machine.machineId} assigned and started`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineId: id }] }
    });

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${id} not found` });
    }

    const newStatus = (reason && reason.toLowerCase().includes('breakdown')) ? 'BREAKDOWN' : 'IDLE';

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: {
        status: newStatus,
        order: newStatus === 'IDLE' ? null : machine.order,
      }
    });

    // If breakdown, log a downtime event
    if (newStatus === 'BREAKDOWN') {
      try {
        await prisma.downtime.create({
          data: {
            machineId: machine.machineId,
            reason: reason || 'Machine Breakdown',
            status: 'OPEN',
            start: new Date(),
          }
        });
      } catch (e) {
        console.error('Failed to log downtime:', e);
      }
    }

    res.json({ success: true, message: `Machine ${machine.machineId} marked as ${newStatus}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Full/Partial machine update supporting both UUID and machineId
const handleUpdateMachine = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, operator, order, output, stage, name, reason } = req.body;

    const machine = await prisma.machine.findFirst({
      where: { OR: [{ id }, { machineId: id }] }
    });

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${id} not found` });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (operator !== undefined) updateData.operator = operator || null;
    if (order !== undefined) updateData.order = order || null;
    if (output !== undefined) updateData.output = Math.max(0, Number(output) || 0);
    if (stage !== undefined) updateData.stage = stage;
    if (name !== undefined) updateData.name = name;

    const updated = await prisma.machine.update({
      where: { id: machine.id },
      data: updateData,
    });

    // If status became BREAKDOWN, log downtime
    if (status === 'BREAKDOWN') {
      try {
        await prisma.downtime.create({
          data: {
            machineId: machine.machineId,
            reason: reason || 'Breakdown reported from Floor Monitor',
            status: 'OPEN',
            start: new Date(),
          }
        });
      } catch (e) {
        console.error('Failed to log downtime on breakdown:', e);
      }
    } else if (machine.status === 'BREAKDOWN' && (status === 'RUNNING' || status === 'IDLE')) {
      // Auto-resolve any open downtimes for this machine
      try {
        await prisma.downtime.updateMany({
          where: { machineId: machine.machineId, status: 'OPEN' },
          data: { status: 'RESOLVED', end: new Date() }
        });
      } catch (e) {
        console.error('Failed to resolve downtimes:', e);
      }
    }

    res.json({
      success: true,
      message: `Machine ${updated.name || updated.machineId} status updated to ${updated.status}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.put('/:id', handleUpdateMachine);
router.patch('/:id', handleUpdateMachine);

export default router;
