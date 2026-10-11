import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/queue', async (req, res) => {
  try {
    const queue = await prisma.dispatch.findMany({
      where: { status: 'PENDING' }
    });
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
