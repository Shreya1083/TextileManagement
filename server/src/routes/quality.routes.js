import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/defects', async (req, res) => {
  try {
    // In a real scenario, this would aggregate rolls with REWORK or REJECTED status
    res.json({
      success: true,
      data: {
        defectRate: 4.2, // percentage
        totalDefects: 128,
        breakdown: [
          { type: 'Weaving Fault', count: 45 },
          { type: 'Stains', count: 32 },
          { type: 'Holes', count: 28 },
          { type: 'Dye Variation', count: 23 }
        ],
        trend: [
          { date: '01 Oct', rate: 4.5 },
          { date: '02 Oct', rate: 4.2 },
          { date: '03 Oct', rate: 3.8 },
          { date: '04 Oct', rate: 4.1 },
          { date: '05 Oct', rate: 3.9 },
          { date: '06 Oct', rate: 4.6 },
          { date: '07 Oct', rate: 4.2 },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/inspect', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, defects, remarks, notes, inspectorId, inspector } = req.body;
    await prisma.roll.update({
      where: { id },
      data: {
        status,
        inspector: inspector || inspectorId || 'Quality Inspector',
        defects: defects ? (Array.isArray(defects) ? defects.join(', ') : String(defects)) : null,
        remarks: remarks || notes || null,
      }
    });
    res.json({ success: true, message: `Roll ${id} inspected successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
