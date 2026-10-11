import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING E2E API & DATABASE TESTS ---');
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (error) {
      console.error(`[FAIL] ${name} - ${error.message}`);
      if (error.response) console.error(error.response.data);
      failed++;
    }
  };

  // 1. Auth Test
  await test('Auth API - Reject invalid login', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, { email: 'fake', password: 'fake' });
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response && e.response.status === 401) return;
      throw e;
    }
  });

  // 2. Setup Data directly in DB to guarantee it exists
  let customerId, orderId, machineId;
  await test('Database - Create test Customer, Machine & Order', async () => {
    const cust = await prisma.customer.create({
      data: { name: 'E2E Test Customer', email: 'e2e@test.com', type: 'BUYER' }
    });
    customerId = cust.id;

    const mach = await prisma.machine.create({
      data: { machineId: 'M-E2E-' + Date.now(), name: 'E2E Loom', stage: 'WEAVING', status: 'RUNNING' }
    });
    machineId = mach.id;

    const ord = await prisma.order.create({
      data: { orderNumber: 'E2E-' + Date.now(), customerId: cust.id, fabric: 'Cotton 40s', color: 'White', quantity: 1000, status: 'IN_PRODUCTION', deadline: new Date() }
    });
    orderId = ord.id;
  });

  // 3. Test generic CRUD API (Orders)
  await test('Orders API - Fetch orders', async () => {
    const res = await axios.get(`${API_URL}/data/orders`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Invalid response structure');
  });

  // 4. Inventory
  await test('Inventory API - Create item', async () => {
    const res = await axios.post(`${API_URL}/data/inventory`, {
      type: 'E2E Poly Yarn', color: 'Blue', current: 500, reserved: 0, reorder: 100, unit: 'kg', status: 'OK'
    });
    if (!res.data.success) throw new Error('Failed to create inventory item');
  });

  // 5. Dashboard APIs
  await test('Dashboard API - Get Stats', async () => {
    const res = await axios.get(`${API_URL}/data/dashboard/stats`);
    if (!res.data.success) throw new Error('Stats API failed');
  });

  await test('Dashboard API - Get EOD Summary', async () => {
    const res = await axios.get(`${API_URL}/data/dashboard/eod/summary`);
    if (!res.data.success) throw new Error('EOD Summary API failed');
  });

  // 6. Finance APIs
  await test('Finance API - Get PnL', async () => {
    const res = await axios.get(`${API_URL}/data/finance/pnl`);
    if (!res.data.success) throw new Error('PnL API failed');
  });

  await test('Finance API - Get Receivables', async () => {
    const res = await axios.get(`${API_URL}/data/finance/receivables`);
    if (!res.data.success) throw new Error('Receivables API failed');
  });

  // 7. Data generation for Rolls (Quality / Dispatch)
  await test('Quality/Dispatch DB - Create Roll', async () => {
    await prisma.roll.create({
      data: {
        rollNumber: 'ROLL-E2E-' + Date.now(),
        order: { connect: { id: orderId } },
        machine: { connect: { id: machineId } },
        length: 120,
        status: 'PASSED',
        producedAt: new Date()
      }
    });
  });

  // 8. Test Quality Queue
  await test('Quality API - Get Rolls', async () => {
    const res = await axios.get(`${API_URL}/data/rolls`);
    if (!res.data.success) throw new Error('Rolls API failed');
  });

  console.log(`\n--- TEST COMPLETE ---`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
