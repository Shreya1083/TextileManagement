import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/low', async (req, res) => {
  try {
    const lowItems = await prisma.inventoryItem.findMany({
      where: { status: 'LOW' }
    });
    res.json({ success: true, data: lowItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
