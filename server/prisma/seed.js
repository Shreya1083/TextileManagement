import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function findOrCreate(model, where, data) {
  const existing = await prisma[model].findFirst({ where });
  if (existing) return existing;
  return prisma[model].create({ data });
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default users
  const demoPassword = 'Admin@123';
  const hashedPassword = await argon2.hash(demoPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@everesttextile.com' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'owner@everesttextile.com',
      password: hashedPassword,
      name: 'Factory Owner',
      role: 'OWNER',
    },
  });

  const storekeeper = await prisma.user.upsert({
    where: { email: 'store@everesttextile.com' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'store@everesttextile.com',
      password: hashedPassword,
      name: 'Store Keeper',
      role: 'STOREKEEPER',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@everesttextile.com' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'supervisor@everesttextile.com',
      password: hashedPassword,
      name: 'Production Supervisor',
      role: 'SUPERVISOR',
    },
  });

  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@everesttextile.com' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'inspector@everesttextile.com',
      password: hashedPassword,
      name: 'Quality Inspector',
      role: 'INSPECTOR',
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: 'accounts@everesttextile.com' },
    update: { password: hashedPassword, isActive: true },
    create: {
      email: 'accounts@everesttextile.com',
      password: hashedPassword,
      name: 'Accountant',
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Created default users');

  // Create default shifts
  const morningShift = await prisma.shift.upsert({
    where: { name: 'Morning Shift' },
    update: {},
    create: {
      name: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
    },
  });

  const afternoonShift = await prisma.shift.upsert({
    where: { name: 'Afternoon Shift' },
    update: {},
    create: {
      name: 'Afternoon Shift',
      startTime: '14:00',
      endTime: '22:00',
    },
  });

  const nightShift = await prisma.shift.upsert({
    where: { name: 'Night Shift' },
    update: {},
    create: {
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
    },
  });

  console.log('✅ Created default shifts');

  // Create sample fabric types
  const cottonFabric = await findOrCreate(
    'fabricType',
    { name: 'Cotton Plain' },
    {
      name: 'Cotton Plain',
      description: 'Regular cotton plain fabric',
      gsm: 150,
      width: 60,
      yarnPerMetre: 200, // 200g per metre
    }
  );

  const polyesterFabric = await findOrCreate(
    'fabricType',
    { name: 'Polyester Blend' },
    {
      name: 'Polyester Blend',
      description: 'Polyester cotton blend fabric',
      gsm: 180,
      width: 60,
      yarnPerMetre: 220,
    }
  );

  console.log('✅ Created sample fabric types');

  // Create sample yarn types
  const yarn1 = await findOrCreate(
    'yarnType',
    { name: 'Cotton 30s', count: '30', color: 'White' },
    {
      name: 'Cotton 30s',
      count: '30',
      color: 'White',
      unit: 'kg',
      reorderLevel: 500,
    }
  );

  const yarn2 = await findOrCreate(
    'yarnType',
    { name: 'Cotton 40s', count: '40', color: 'White' },
    {
      name: 'Cotton 40s',
      count: '40',
      color: 'White',
      unit: 'kg',
      reorderLevel: 300,
    }
  );

  const yarn3 = await findOrCreate(
    'yarnType',
    { name: 'Polyester 50s', count: '50', color: 'Dyed' },
    {
      name: 'Polyester 50s',
      count: '50',
      color: 'Dyed',
      unit: 'kg',
      reorderLevel: 200,
    }
  );

  console.log('✅ Created sample yarn types');

  // Create sample machines
  const machines = [
    { name: 'Spinning Machine 1', machineCode: 'SPM-001', stage: 'SPINNING' },
    { name: 'Spinning Machine 2', machineCode: 'SPM-002', stage: 'SPINNING' },
    { name: 'Weaving Machine 1', machineCode: 'WVM-001', stage: 'WEAVING' },
    { name: 'Weaving Machine 2', machineCode: 'WVM-002', stage: 'WEAVING' },
    { name: 'Dyeing Machine 1', machineCode: 'DYM-001', stage: 'DYEING' },
    { name: 'Finishing Machine 1', machineCode: 'FNM-001', stage: 'FINISHING' },
  ];

  for (const machine of machines) {
    await prisma.machine.upsert({
      where: { machineCode: machine.machineCode },
      update: machine,
      create: machine,
    });
  }

  console.log('✅ Created sample machines');

  // Create sample suppliers
  const supplier1 = await findOrCreate(
    'supplier',
    { name: 'ABC Yarn Suppliers' },
    {
      name: 'ABC Yarn Suppliers',
      contactName: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'contact@abcyarn.com',
      address: 'Mumbai, Maharashtra',
      gstin: '27AAAAA0000A1Z5',
    }
  );

  const supplier2 = await findOrCreate(
    'supplier',
    { name: 'XYZ Cotton Mills' },
    {
      name: 'XYZ Cotton Mills',
      contactName: 'Suresh Patel',
      phone: '+91-9876543211',
      email: 'info@xyzcotton.com',
      address: 'Ahmedabad, Gujarat',
      gstin: '24BBBBB0000B2Z5',
    }
  );

  console.log('✅ Created sample suppliers');

  // Create sample buyers
  const buyer1 = await findOrCreate(
    'buyer',
    { name: 'Fashion Retail Co.' },
    {
      name: 'Fashion Retail Co.',
      contactName: 'Amit Shah',
      phone: '+91-9876543212',
      email: 'orders@fashionretail.com',
      address: 'Delhi',
      gstin: '07CCCCC0000C3Z5',
    }
  );

  const buyer2 = await findOrCreate(
    'buyer',
    { name: 'Global Textiles Ltd.' },
    {
      name: 'Global Textiles Ltd.',
      contactName: 'Priya Sharma',
      phone: '+91-9876543213',
      email: 'procurement@globaltextiles.com',
      address: 'Bangalore, Karnataka',
      gstin: '29DDDDD0000D4Z5',
    }
  );

  console.log('✅ Created sample buyers');

  // Create factory settings
  const settings = [
    { key: 'MILL_NAME', value: 'Everest Textile Mills' },
    { key: 'MILL_ADDRESS', value: 'Industrial Area, Phase 2, Ludhiana, Punjab' },
    { key: 'MILL_GSTIN', value: '03AAAAA1234A1Z5' },
    { key: 'INVOICE_PREFIX', value: 'EVR' },
    { key: 'ROLL_PREFIX', value: 'EVR' },
    { key: 'QC_WAIT_THRESHOLD_HOURS', value: '24' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Created factory settings');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📝 Default Login Credentials:');
  console.log(`   Owner:      owner@everesttextile.com / ${demoPassword}`);
  console.log(`   Store:      store@everesttextile.com / ${demoPassword}`);
  console.log(`   Supervisor: supervisor@everesttextile.com / ${demoPassword}`);
  console.log(`   Inspector:  inspector@everesttextile.com / ${demoPassword}`);
  console.log(`   Accounts:   accounts@everesttextile.com / ${demoPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
