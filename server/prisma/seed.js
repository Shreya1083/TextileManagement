import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Default password for all test users
  const defaultPassword = 'Admin@123'
  const hashedPassword = await argon2.hash(defaultPassword)

  // Test users with different roles
  const users = [
    {
      email: 'owner@textile.com',
      name: 'Owner Admin',
      role: 'OWNER',
      password: hashedPassword,
    },
    {
      email: 'store@textile.com',
      name: 'Store Keeper',
      role: 'STOREKEEPER',
      password: hashedPassword,
    },
    {
      email: 'supervisor@textile.com',
      name: 'Production Supervisor',
      role: 'SUPERVISOR',
      password: hashedPassword,
    },
    {
      email: 'inspector@textile.com',
      name: 'Quality Inspector',
      role: 'INSPECTOR',
      password: hashedPassword,
    },
    {
      email: 'accounts@textile.com',
      name: 'Accounts Manager',
      role: 'ACCOUNTS',
      password: hashedPassword,
    },
    {
      email: 'buyer@textile.com',
      name: 'Buyer User',
      role: 'BUYER',
      password: hashedPassword,
    },
    {
      email: 'worker@textile.com',
      name: 'Raju Worker',
      role: 'WORKER',
      password: hashedPassword,
    },
  ]

  // Create users
  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: userData,
      })
      console.log(`✅ Created user: ${user.email} (${user.role})`)
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error.message)
    }
  }

  // Create Customer
  const customer = await prisma.customer.upsert({
    where: { id: 'CUST-001' },
    update: {},
    create: {
      id: 'CUST-001',
      name: 'Sharma Fabrics',
      email: 'contact@sharmafabrics.com',
      phone: '+919876543210'
    }
  });

  // Create Order
  const order = await prisma.order.upsert({
    where: { orderNumber: 'ORD-2024' },
    update: {},
    create: {
      orderNumber: 'ORD-2024',
      customerId: customer.id,
      fabric: 'Cotton Voile',
      color: 'Sky Blue',
      quantity: 1200,
      status: 'IN_PRODUCTION',
      deadline: new Date('2026-10-25'),
      progress: 45
    }
  });

  // Create Machine
  const machine = await prisma.machine.upsert({
    where: { machineId: 'M-01' },
    update: {},
    create: {
      machineId: 'M-01',
      name: 'Spinner A1',
      stage: 'Spinning',
      status: 'RUNNING',
      output: 320
    }
  });

  // Create Roll
  await prisma.roll.upsert({
    where: { rollNumber: 'EVR-2026-000189' },
    update: {},
    create: {
      rollNumber: 'EVR-2026-000189',
      orderId: order.id,
      machineId: machine.id,
      length: 120,
      status: 'AWAITING_QC',
      producedAt: new Date()
    }
  });

  // Create Inventory
  await prisma.inventoryItem.create({
    data: { type: 'Cotton 40s', color: 'White', current: 850, reserved: 320, reorder: 500, unit: 'kg', status: 'OK' }
  });

  // Create Worker
  await prisma.worker.upsert({
    where: { workerId: 'W-001' },
    update: {},
    create: { workerId: 'W-001', name: 'Mohan Kumar', role: 'Spinner Operator', dept: 'Production', wage: 650, basis: 'daily' }
  });

  await prisma.worker.upsert({
    where: { workerId: 'W-002' },
    update: {},
    create: { workerId: 'W-002', name: 'Raju Worker', role: 'Weaver', dept: 'Production', wage: 750, basis: 'daily' }
  });
  console.log('\n📋 Test User Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Password for all users: Admin@123\n')
  users.forEach(u => {
    console.log(`${u.role.padEnd(12)} → ${u.email}`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
