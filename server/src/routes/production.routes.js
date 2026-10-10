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
    await prisma.machine.update({
      where: { id },
      data: { status: 'RUNNING' }
    });
    res.json({ success: true, message: `Machine ${id} started` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    await prisma.machine.update({
      where: { id },
      data: { status: 'IDLE' } // or BREAKDOWN based on reason
    });
    res.json({ success: true, message: `Machine ${id} stopped` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
