import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/finished', async (req, res) => {
  try {
    // Usually finished stock are rolls that passed QC but not dispatched
    const finishedStock = await prisma.roll.findMany({
      where: { status: 'PASSED' },
      include: { order: true }
    });
    res.json({ success: true, data: finishedStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/inspect', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, inspector, defects, notes } = req.body;
    const roll = await prisma.roll.update({
      where: { id },
      data: { status, inspector }
    });
    res.json({ success: true, data: roll, message: 'Roll inspected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
