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

export default router;
