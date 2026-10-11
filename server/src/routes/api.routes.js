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
      const options = { include };
      if (['notification', 'downtime', 'order', 'roll', 'productionEntry'].includes(modelName)) {
        options.orderBy = { createdAt: 'desc' };
      }
      let data = await prisma[modelName].findMany(options);

      // Auto-seed suppliers if none exist
      if (modelName === 'supplier' && data.length === 0) {
        const seedSuppliers = [
          {
            name: 'Agarwal Yarns Pvt Ltd',
            contactPerson: 'Ramesh Agarwal',
            city: 'Bhilwara',
            state: 'Rajasthan',
            phone: '+91 98290 12345',
            altPhone: '+91 98290 54321',
            email: 'sales@agarwalyarns.com',
            gstin: '08AABCA1234B1Z5',
            yarnTypes: 'Cotton 40s Combed, Cotton 30s Carded',
            leadDays: '5',
            paymentTerms: 'Net 30',
            activePos: 2,
            notes: 'Primary supplier for combed cotton yarns'
          },
          {
            name: 'Vardhman Textiles Ltd',
            contactPerson: 'Sanjay Oswal',
            city: 'Ludhiana',
            state: 'Punjab',
            phone: '+91 98140 54321',
            email: 'orders@vardhman.com',
            gstin: '03AABCV5678C1Z2',
            yarnTypes: 'Polyester 150D, Poly-Cotton Blends',
            leadDays: '7',
            paymentTerms: 'Net 45',
            activePos: 1,
            notes: 'High reliability synthetic yarn partner'
          },
          {
            name: 'Surat Synthetics Corp',
            contactPerson: 'Kishore Patel',
            city: 'Surat',
            state: 'Gujarat',
            phone: '+91 98251 98765',
            email: 'info@suratsynthetics.com',
            gstin: '24AABCS9988D1Z9',
            yarnTypes: 'Viscose Rayon 30s, Microfiber',
            leadDays: '4',
            paymentTerms: 'Advance',
            activePos: 0,
            notes: 'Speciality viscose and microfilament supplier'
          },
          {
            name: 'Coimbatore Cotton Mills',
            contactPerson: 'M. Sundaram',
            city: 'Coimbatore',
            state: 'Tamil Nadu',
            phone: '+91 94432 11223',
            email: 'supply@coimbatorecotton.in',
            gstin: '33AABCC3344E1Z4',
            yarnTypes: 'Organic Cotton 60s, Giza Cotton',
            leadDays: '10',
            paymentTerms: 'Net 30',
            activePos: 3,
            notes: 'Premium organic yarn supplier with GOTS certification'
          }
        ];
        await prisma.supplier.createMany({ data: seedSuppliers });
        data = await prisma.supplier.findMany(options);
      }

      // Auto-seed production entries if none exist
      if (modelName === 'productionEntry' && data.length === 0) {
        const mList = await prisma.machine.findMany();
        if (mList.length > 0) {
          const defaultEntries = [
            {
              date: new Date(),
              shift: 'Morning',
              machineId: mList[0].machineId,
              orderId: 'ORD-2028',
              output: 1200,
              waste: 24,
              rolls: 12,
              operator: 'Rajesh Kumar'
            },
            {
              date: new Date(),
              shift: 'Morning',
              machineId: mList[1 % mList.length].machineId,
              orderId: 'ORD-2029',
              output: 700,
              waste: 11,
              rolls: 7,
              operator: 'Sunil Sharma'
            }
          ];
          await prisma.productionEntry.createMany({ data: defaultEntries });
          data = await prisma.productionEntry.findMany(options);
        }
      }

      if (modelName === 'productionEntry') {
        data = data.map(e => ({
          ...e,
          machineId: e.machine || e.machineId,
          orderId: e.order || e.orderId
        }));
      }

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
      let bodyData = { ...req.body };

      // Special handling for productionEntry to resolve machine foreign key
      if (modelName === 'productionEntry') {
        const { machineId, output, waste, rolls, date, orderId, operator, shift } = bodyData;
        let machine = await prisma.machine.findFirst({
          where: { OR: [{ id: machineId }, { machineId: machineId }] }
        });

        let targetMachineId = machine ? machine.machineId : machineId;
        if (!machine) {
          const anyM = await prisma.machine.findFirst();
          if (anyM) {
            targetMachineId = anyM.machineId;
            machine = anyM;
          } else {
            const newM = await prisma.machine.create({
              data: {
                machineId: machineId || 'M-01',
                name: `Loom ${machineId || 'M-01'}`,
                stage: 'Weaving',
                status: 'RUNNING'
              }
            });
            targetMachineId = newM.machineId;
            machine = newM;
          }
        }

        bodyData = {
          date: date ? new Date(date) : new Date(),
          shift: shift || 'Morning',
          machineId: targetMachineId || 'M-01',
          orderId: orderId || req.body.order || null,
          output: Number(output) || 0,
          waste: Number(waste) || 0,
          rolls: Number(rolls) || 0,
          operator: operator || 'Operator'
        };

        const createdEntry = await prisma.productionEntry.create({ data: bodyData });
        const responseData = {
          ...createdEntry,
          machineId: createdEntry.machineId || createdEntry.machine,
          orderId: createdEntry.orderId || createdEntry.order
        };

        // Update machine stats and assignment
        if (machine) {
          await prisma.machine.update({
            where: { id: machine.id },
            data: {
              status: 'RUNNING',
              output: { increment: Math.round(Number(output) || 0) },
              operator: operator || machine.operator,
              order: orderId || machine.order
            }
          });
        }

        return res.status(201).json({ success: true, data: responseData });
      }

      // Special handling for supplier form data
      if (modelName === 'supplier') {
        if (!bodyData.name && bodyData.companyName) {
          bodyData.name = bodyData.companyName;
        }
        if (typeof bodyData.activePos === 'string') {
          bodyData.activePos = parseInt(bodyData.activePos, 10) || 0;
        }
      }

      // Special handling for order creation
      if (modelName === 'order') {
        if (!bodyData.orderNumber) {
          bodyData.orderNumber = bodyData.orderId || `ORD-${Date.now().toString().slice(-6)}`;
        }
        delete bodyData.orderId;
        if (!bodyData.color && bodyData.colour) {
          bodyData.color = bodyData.colour;
        }
        delete bodyData.colour;
        if (!bodyData.color) bodyData.color = 'Natural';
        
        // Ensure customerId exists
        if (!bodyData.customerId) {
          const firstCust = await prisma.customer.findFirst();
          if (firstCust) {
            bodyData.customerId = firstCust.id;
          } else {
            const newCust = await prisma.customer.create({
              data: { name: 'Standard Buyer', city: 'Surat', phone: '9876500000' }
            });
            bodyData.customerId = newCust.id;
          }
        }
        delete bodyData.customer; // in case object was passed

        bodyData.quantity = Math.round(Number(bodyData.quantity)) || 100;
        bodyData.rate = Number(bodyData.rate) || 0;
        bodyData.deadline = bodyData.deadline ? new Date(bodyData.deadline) : new Date(Date.now() + 7 * 86400000);
        bodyData.status = bodyData.status || 'CONFIRMED';
        bodyData.progress = Math.round(Number(bodyData.progress)) || 0;
      }

      // Special handling for purchase order creation
      if (modelName === 'purchaseOrder') {
        if (!bodyData.poId) {
          bodyData.poId = bodyData.poNumber || `PO-${Date.now().toString().slice(-6)}`;
        }
        delete bodyData.poNumber;

        // Resolve supplier string
        if (!bodyData.supplier && bodyData.supplierId) {
          const sup = await prisma.supplier.findUnique({ where: { id: bodyData.supplierId } });
          bodyData.supplier = sup ? sup.name : bodyData.supplierId;
        }
        delete bodyData.supplierId;
        if (!bodyData.supplier) bodyData.supplier = 'Vendor';

        bodyData.yarn = bodyData.yarn || 'Cotton 40s';
        bodyData.qty = Number(bodyData.qty) || 0;
        bodyData.rate = Number(bodyData.rate) || 0;
        bodyData.total = Number(bodyData.total) || (bodyData.qty * bodyData.rate) || 0;
        bodyData.expected = bodyData.expected ? new Date(bodyData.expected) : new Date(Date.now() + 3 * 86400000);
        if (!bodyData.status) bodyData.status = 'RAISED';
      }

      // Special handling for gate entry / GRN creation (auto-increment stock)
      if (modelName === 'gateEntry') {
        if (!bodyData.grnId) {
          bodyData.grnId = bodyData.geNumber || `GRN-${Date.now().toString().slice(-6)}`;
        }
        delete bodyData.geNumber;

        if (bodyData.challanNo && !bodyData.challan) bodyData.challan = bodyData.challanNo;
        delete bodyData.challanNo;
        if (!bodyData.challan) bodyData.challan = 'CH-' + Math.floor(Math.random() * 9000 + 1000);

        if (bodyData.vehicleNo && !bodyData.vehicle) bodyData.vehicle = bodyData.vehicleNo;
        delete bodyData.vehicleNo;
        if (!bodyData.vehicle) bodyData.vehicle = 'TRUCK-' + Math.floor(Math.random() * 900 + 100);

        const qtyVal = Number(bodyData.qty !== undefined && bodyData.qty !== '' ? bodyData.qty : (bodyData.netWeight || 0));
        bodyData.qty = qtyVal;
        delete bodyData.netWeight;

        bodyData.bags = Math.round(Number(bodyData.bags)) || 1;
        bodyData.date = bodyData.date ? new Date(bodyData.date) : new Date();
        if (!bodyData.supplier) bodyData.supplier = 'Vendor';
        if (!bodyData.yarn) bodyData.yarn = 'Cotton 40s';

        const { yarn, colour, qty } = bodyData;
        if (yarn && qty) {
          try {
            // First attempt: match both type and color (case-insensitive)
            let existing = await prisma.inventoryItem.findFirst({
              where: {
                type: { equals: yarn.trim(), mode: 'insensitive' },
                ...(colour ? { color: { equals: colour.trim(), mode: 'insensitive' } } : {})
              }
            });

            // Second attempt: match type only if specific color wasn't found
            if (!existing) {
              existing = await prisma.inventoryItem.findFirst({
                where: {
                  type: { equals: yarn.trim(), mode: 'insensitive' }
                }
              });
            }

            if (existing) {
              const newCurrent = Math.max(0, Number(existing.current || 0) + Number(qty));
              const reserved = Number(existing.reserved || 0);
              const reorder = Number(existing.reorder || 100);
              const available = newCurrent - reserved;
              const newStatus = available <= 0 ? 'OUT' : available < reorder ? 'LOW' : 'OK';

              await prisma.inventoryItem.update({
                where: { id: existing.id },
                data: {
                  current: newCurrent,
                  status: newStatus,
                  ...(colour && (!existing.color || existing.color === 'Raw') ? { color: colour.trim() } : {})
                }
              });
            } else {
              // Create brand new inventory item so it appears in the list
              const qtyNum = Number(qty);
              const reorderLvl = Math.round(qtyNum * 0.3) || 100;
              await prisma.inventoryItem.create({
                data: {
                  type: yarn.trim(),
                  color: colour ? colour.trim() : 'White',
                  current: qtyNum,
                  reserved: 0,
                  reorder: reorderLvl,
                  unit: 'kg',
                  status: qtyNum > reorderLvl ? 'OK' : 'LOW'
                }
              });
            }
          } catch (e) {
            console.error('Failed to auto-update inventory on GRN:', e);
          }
        }
      }

      // Special handling for dispatch creation
      if (modelName === 'dispatch') {
        if (!bodyData.dispatchId) {
          bodyData.dispatchId = `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`;
        }
        bodyData.rolls = Math.round(Number(bodyData.rolls)) || 1;
        bodyData.metres = Number(bodyData.metres) || 0;
        bodyData.date = bodyData.date ? new Date(bodyData.date) : new Date();
        bodyData.status = bodyData.status || 'PENDING';
        bodyData.buyer = bodyData.buyer || 'Direct Buyer';
        bodyData.order = bodyData.order || 'ORD-DIRECT';

        // Auto-update linked order status if exists
        if (bodyData.order && (bodyData.status === 'DISPATCHED' || bodyData.status === 'DELIVERED')) {
          try {
            await prisma.order.updateMany({
              where: { orderNumber: bodyData.order },
              data: { status: 'DISPATCHED', progress: 100 }
            });
          } catch (e) {
            console.error('Failed to update order status on dispatch:', e);
          }
        }
      }

      // Special handling for invoice creation
      if (modelName === 'invoice') {
        if (!bodyData.invoiceId) {
          bodyData.invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 89999 + 10000)}`;
        }
        bodyData.amount = Number(bodyData.amount) || 0;
        bodyData.paid = Number(bodyData.paid) || 0;
        bodyData.balance = bodyData.balance !== undefined ? Number(bodyData.balance) : (bodyData.amount - bodyData.paid);
        bodyData.date = bodyData.date ? new Date(bodyData.date) : new Date();
        bodyData.status = bodyData.status || (bodyData.balance <= 0 ? 'PAID' : (bodyData.paid > 0 ? 'PARTIAL' : 'UNPAID'));
      }

      // Special handling for customer / buyer creation
      if (modelName === 'customer') {
        if (!bodyData.buyerId) {
          bodyData.buyerId = `BUYER-${Date.now().toString().slice(-6)}`;
        }
        if (bodyData.creditLimit !== undefined) {
          bodyData.creditLimit = Number(bodyData.creditLimit) || 0;
        }
        bodyData.type = bodyData.type || 'BUYER';
      }

      // Special handling for productionEntry creation
      if (modelName === 'productionEntry') {
        bodyData.date = bodyData.date ? new Date(bodyData.date) : new Date();
        bodyData.output = Number(bodyData.output) || 0;
        bodyData.waste = Number(bodyData.waste) || 0;
        bodyData.rolls = Math.round(Number(bodyData.rolls)) || 1;
        if (bodyData.machine && !bodyData.machineId) bodyData.machineId = bodyData.machine;
        if (bodyData.order && !bodyData.orderId) bodyData.orderId = bodyData.order;
        delete bodyData.machine;
        delete bodyData.order;
        bodyData.operator = bodyData.operator || 'Operator';
        bodyData.shift = bodyData.shift || 'Morning';
      }

      const data = await prisma[modelName].create({ data: bodyData, include });
      res.status(201).json({ success: true, data });
    } catch (error) {
      console.error(`Error creating ${modelName}:`, error);
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // PUT update
  route.put('/:id', async (req, res) => {
    try {
      let updateData = { ...req.body };
      if (modelName === 'order') {
        if (updateData.quantity) updateData.quantity = Math.round(Number(updateData.quantity));
        if (updateData.rate) updateData.rate = Number(updateData.rate);
        if (updateData.deadline) updateData.deadline = new Date(updateData.deadline);
        if (updateData.progress !== undefined) updateData.progress = Math.round(Number(updateData.progress));
      }
      if (modelName === 'inventoryItem') {
        if (updateData.current !== undefined) updateData.current = Number(updateData.current);
        if (updateData.reserved !== undefined) updateData.reserved = Number(updateData.reserved);
        if (updateData.reorder !== undefined) updateData.reorder = Number(updateData.reorder);
      }
      if (modelName === 'purchaseOrder') {
        if (updateData.qty !== undefined) updateData.qty = Number(updateData.qty);
        if (updateData.rate !== undefined) updateData.rate = Number(updateData.rate);
        if (updateData.total !== undefined) updateData.total = Number(updateData.total);
        if (updateData.expected) updateData.expected = new Date(updateData.expected);
      }
      if (modelName === 'dispatch') {
        if (updateData.rolls !== undefined) updateData.rolls = Math.round(Number(updateData.rolls));
        if (updateData.metres !== undefined) updateData.metres = Number(updateData.metres);
        if (updateData.date) updateData.date = new Date(updateData.date);

        if (updateData.order && (updateData.status === 'DISPATCHED' || updateData.status === 'DELIVERED')) {
          try {
            await prisma.order.updateMany({
              where: { orderNumber: updateData.order },
              data: { status: 'DISPATCHED', progress: 100 }
            });
          } catch (e) {
            console.error('Failed to update order status on dispatch update:', e);
          }
        }
      }
      if (modelName === 'invoice') {
        if (updateData.amount !== undefined) updateData.amount = Number(updateData.amount);
        if (updateData.paid !== undefined) updateData.paid = Number(updateData.paid);
        if (updateData.balance !== undefined) updateData.balance = Number(updateData.balance);
        if (updateData.date) updateData.date = new Date(updateData.date);
      }
      const data = await prisma[modelName].update({
        where: { id: req.params.id },
        data: updateData,
        include,
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
router.use('/buyers', crudRoutes('customer'));
router.use('/rolls', crudRoutes('roll', { order: true, machine: true }));
router.use('/suppliers', crudRoutes('supplier'));
router.use('/gate-entries', crudRoutes('gateEntry'));
router.use('/purchase-orders', crudRoutes('purchaseOrder'));
router.use('/dispatch', crudRoutes('dispatch'));
router.use('/dispatches', crudRoutes('dispatch'));
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
