import express from 'express';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/costing', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { date: 'desc' }
    });

    // In a real app we'd aggregate PurchaseOrders for material, Workers for labor, etc. per order.
    // For MVP dynamic calculation, we derive it from invoice amount and standard rates
    const data = invoices.map(inv => {
      const totalCost = inv.amount * 0.75;
      const profit = inv.amount - totalCost;
      const profitPct = inv.amount > 0 ? ((profit / inv.amount) * 100).toFixed(1) : 0;
      return {
        order: inv.dispatch, // using dispatch ID as proxy for order ID if not stored
        buyer: inv.buyer,
        fabric: 'Mixed', // mock as we don't have this in invoice directly
        qty: Math.round(inv.amount / 85),
        material: inv.amount * 0.45,
        labour: inv.amount * 0.15,
        overhead: inv.amount * 0.15,
        total: totalCost,
        invoice: inv.amount,
        profit: profit,
        profitPct: profitPct,
        status: inv.status
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/pnl', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    const invoices = await prisma.invoice.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' }
    });

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
    });

    const workers = await prisma.worker.findMany();
    
    // Monthly labor cost is approximately (sum of worker wages * 25 days)
    const monthlyLabor = workers.reduce((acc, w) => acc + (w.wage * 25), 0);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const map = {};
    
    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const m = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if(!map[m]) map[m] = { month: months[d.getMonth()], year: d.getFullYear(), revenue: 0, materialCost: 0, laborCost: monthlyLabor, overheadCost: 200000 };
      map[m].revenue += inv.amount;
    });

    purchaseOrders.forEach(po => {
      const d = new Date(po.createdAt);
      const m = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if(!map[m]) map[m] = { month: months[d.getMonth()], year: d.getFullYear(), revenue: 0, materialCost: 0, laborCost: monthlyLabor, overheadCost: 200000 };
      map[m].materialCost += po.total;
    });

    let data = Object.values(map).sort((a,b) => (a.year - b.year) || (months.indexOf(a.month) - months.indexOf(b.month)));
    
    // Add missing months
    if(data.length < 6) {
      for(let i=5; i>=0; i--) {
        let d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStr = `${months[d.getMonth()]} ${d.getFullYear()}`;
        if (!map[mStr]) {
          data.push({ month: months[d.getMonth()], year: d.getFullYear(), revenue: 0, materialCost: 0, laborCost: monthlyLabor, overheadCost: 200000 });
        }
      }
    }
    
    // Sort again and take last 6
    data.sort((a,b) => (a.year - b.year) || (months.indexOf(a.month) - months.indexOf(b.month)));
    data = data.slice(-6);

    // Calculate total cost and profit
    data = data.map(d => {
      const cost = d.materialCost + d.laborCost + d.overheadCost;
      return {
        month: d.month,
        revenue: d.revenue,
        materialCost: d.materialCost,
        laborCost: d.laborCost,
        overheadCost: d.overheadCost,
        cost: cost,
        profit: d.revenue - cost
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/receivables', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['UNPAID', 'PARTIAL'] } }
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let overdue30 = 0;
    let overdue60 = 0;
    let overdue90 = 0;

// Owner Dashboard  — accepts ?from=YYYY-MM-DD&to=YYYY-MM-DD  (also legacy ?startDate/endDate)
router.get('/dashboard/owner', authorize('OWNER'), asyncHandler(financeController.getOwnerDashboard));

export default router;
