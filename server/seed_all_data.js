import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Clearing existing mock data...')
  
  // Create Suppliers
  const suppliers = [
    { name: 'TexFab Yarns Ltd.', city: 'Surat', phone: '9876543210', yarnTypes: 'Cotton, Poly' },
    { name: 'Global Threads Inc.', city: 'Bhilwara', phone: '9876543211', yarnTypes: 'Linen' },
    { name: 'Sunrise Synthetics', city: 'Ahmedabad', phone: '9876543212', yarnTypes: 'Viscose' }
  ];
  for (const s of suppliers) await prisma.supplier.create({ data: s })
  console.log('Seeded Suppliers')

  // Create Customers
  const custs = []
  for(let i=1; i<=10; i++) {
    const c = await prisma.customer.create({
      data: { name: `Customer ${i} Garments`, type: 'BUYER', city: 'Mumbai', phone: '1234567890', creditLimit: 500000 }
    })
    custs.push(c)
  }
  console.log('Seeded Customers')

  // Create Orders
  const orders = []
  for(let i=1; i<=20; i++) {
    const o = await prisma.order.create({
      data: {
        orderNumber: `ORD-${2000 + i}-${Date.now()}`,
        customerId: custs[i % 10].id,
        fabric: i % 2 === 0 ? 'Cotton 40s' : 'Poly Viscose',
        color: i % 3 === 0 ? 'Red' : 'Blue',
        quantity: 5000 + (i * 100),
        rate: 150 + i,
        status: i > 15 ? 'DISPATCHED' : (i > 10 ? 'READY_TO_SHIP' : 'IN_PRODUCTION'),
        progress: i > 15 ? 100 : (i * 5),
        deadline: new Date(new Date().setDate(new Date().getDate() + (i * 2)))
      }
    })
    orders.push(o)
  }
  console.log('Seeded Orders')

  // Create Machines
  const machines = []
  for(let i=1; i<=15; i++) {
    const m = await prisma.machine.create({
      data: {
        machineId: `M-${i.toString().padStart(2, '0')}-${Date.now()}`,
        name: `Loom ${i}`,
        stage: 'WEAVING',
        status: i % 5 === 0 ? 'BREAKDOWN' : 'RUNNING',
        output: Math.floor(Math.random() * 2000)
      }
    })
    machines.push(m)
  }
  console.log('Seeded Machines')

  // Create Rolls
  for(let i=1; i<=50; i++) {
    await prisma.roll.create({
      data: {
        rollNumber: `ROLL-${1000 + i}-${Date.now()}`,
        orderId: orders[i % 20].id,
        machineId: machines[i % 15].id,
        length: 100 + Math.floor(Math.random() * 50),
        status: i % 10 === 0 ? 'REJECTED' : (i % 7 === 0 ? 'AWAITING_QC' : 'PASSED'),
        producedAt: new Date(new Date().setHours(new Date().getHours() - i))
      }
    })
  }
  console.log('Seeded Rolls')

  // Inventory Items
  const items = [
    { type: 'Cotton 40s Yarn', color: 'Raw', current: 1500, reserved: 200, reorder: 500, unit: 'kg', status: 'OK' },
    { type: 'Poly 150D', color: 'Black', current: 300, reserved: 100, reorder: 400, unit: 'kg', status: 'LOW' },
    { type: 'Viscose 30s', color: 'Raw', current: 0, reserved: 0, reorder: 200, unit: 'kg', status: 'OUT' }
  ];
  for (const i of items) await prisma.inventoryItem.create({ data: i })
  console.log('Seeded Inventory')

  // Production Entries
  for(let i=1; i<=30; i++) {
    await prisma.productionEntry.create({
      data: {
        date: new Date(new Date().setDate(new Date().getDate() - (i % 5))),
        shift: i % 2 === 0 ? 'Morning' : 'Evening',
        machine: machines[i % 15].machineId,
        order: orders[i % 20].orderNumber,
        output: 500 + Math.floor(Math.random() * 300),
        waste: 5 + Math.floor(Math.random() * 10),
        operator: `Worker ${i}`,
        rolls: 5
      }
    })
  }
  console.log('Seeded Production Entries')

  // Invoices (To populate P&L and Revenue)
  for(let i=1; i<=30; i++) {
    const amt = 50000 + (Math.random() * 150000)
    await prisma.invoice.create({
      data: {
        invoiceId: `INV-26-${100 + i}-${Date.now()}`,
        buyer: custs[i % 10].name,
        dispatch: `DSP-${200 + i}`,
        amount: amt,
        paid: i % 3 === 0 ? amt : 0,
        balance: i % 3 === 0 ? 0 : amt,
        date: new Date(new Date().setDate(new Date().getDate() - (i * 5))),
        status: i % 3 === 0 ? 'PAID' : 'UNPAID'
      }
    })
  }
  console.log('Seeded Invoices')

  // Dispatches
  for(let i=1; i<=15; i++) {
    await prisma.dispatch.create({
      data: {
        dispatchId: `DSP-${200 + i}-${Date.now()}`,
        buyer: custs[i % 10].name,
        order: orders[i % 20].orderNumber,
        rolls: 10 + i,
        metres: 1200 + (i * 100),
        date: new Date(new Date().setDate(new Date().getDate() - i)),
        status: i > 10 ? 'PENDING' : 'DELIVERED'
      }
    })
  }
  console.log('Seeded Dispatches')

  // Downtimes
  for(let i=1; i<=10; i++) {
    await prisma.downtime.create({
      data: {
        machine: machines[i % 15].machineId,
        name: machines[i % 15].name,
        start: new Date(new Date().setHours(new Date().getHours() - (i * 2))),
        reason: i % 2 === 0 ? 'Mechanical Fault' : 'Yarn Breakage',
        status: i > 8 ? 'OPEN' : 'CLOSED'
      }
    })
  }
  console.log('Seeded Downtime logs')
  
  console.log('ALL SEEDING COMPLETE!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
