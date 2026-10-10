import express from 'express';
import prisma from '../config/database.js';
import dashboardRoutes from './dashboard.routes.js';
import hrRoutes from './hr.routes.js';
import financeRoutes from './finance.routes.js';
import qualityRoutes from './quality.routes.js';
import productionRoutes from './production.routes.js';
import inventoryCustomRoutes from './inventory-custom.routes.js';
import dispatchCustomRoutes from './dispatch-custom.routes.js';
import rollsCustomRoutes from './rolls-custom.routes.js';

const router = express.Router();

// Helper to handle CRUD operations for a given Prisma model
const crudRoutes = (modelName, include = null) => {
  const route = express.Router();

  // GET all
  route.get('/', async (req, res) => {
    try {
      const data = await prisma[modelName].findMany({ include });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // GET by ID
  route.get('/:id', async (req, res) => {
    try {
      const data = await prisma[modelName].findUnique({ where: { id: req.params.id }, include });
      if (!data) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // POST create
  route.post('/', async (req, res) => {
    try {
      const data = await prisma[modelName].create({ data: req.body });
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // PUT update
  route.put('/:id', async (req, res) => {
    try {
      const data = await prisma[modelName].update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // DELETE
  route.delete('/:id', async (req, res) => {
    try {
      await prisma[modelName].delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  return route;
};

// Custom route overrides (must be mounted BEFORE generic CRUD to capture specific paths like /low or /finished)
router.use('/machines', productionRoutes);
router.use('/inventory', inventoryCustomRoutes);
router.use('/dispatch', dispatchCustomRoutes);
router.use('/rolls', rollsCustomRoutes);

// Register generic CRUD routes for each model
router.use('/orders', crudRoutes('order', { customer: true }));
router.use('/machines', crudRoutes('machine'));
router.use('/inventory', crudRoutes('inventoryItem'));
router.use('/workers', crudRoutes('worker'));
router.use('/customers', crudRoutes('customer'));
router.use('/rolls', crudRoutes('roll', { order: true, machine: true }));
router.use('/suppliers', crudRoutes('supplier'));
router.use('/gate-entries', crudRoutes('gateEntry'));
router.use('/purchase-orders', crudRoutes('purchaseOrder'));
router.use('/dispatch', crudRoutes('dispatch'));
router.use('/invoices', crudRoutes('invoice'));
router.use('/production-entries', crudRoutes('productionEntry'));
router.use('/downtimes', crudRoutes('downtime'));
router.use('/users', crudRoutes('user'));
router.use('/mill-settings', crudRoutes('millSetting'));
router.use('/boms', crudRoutes('bOM', { items: true }));
router.use('/notifications', crudRoutes('notification'));
router.use('/dashboard', dashboardRoutes);
router.use('/hr', hrRoutes);
router.use('/finance', financeRoutes);
router.use('/quality', qualityRoutes);
router.use('/settings', crudRoutes('settings'));

export default router;
