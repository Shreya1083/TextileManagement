import { PrismaClient, WageBasis } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo users, workers, and historical wage records...');

  const demoPassword = 'demo123';
  const hashedPassword = await argon2.hash(demoPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // Seed demo users to match frontend logins
  const demoUsers = [
    { email: 'owner@everest.com', name: 'Rajesh Sharma', role: 'OWNER' },
    { email: 'store@everest.com', name: 'Kamla Devi', role: 'STOREKEEPER' },
    { email: 'supervisor@everest.com', name: 'Arvind Kumar', role: 'SUPERVISOR' },
    { email: 'inspector@everest.com', name: 'Neha Shah', role: 'INSPECTOR' },
    { email: 'accounts@everest.com', name: 'Pradeep Gupta', role: 'ACCOUNTS' },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, role: u.role, isActive: true },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        isActive: true,
      },
    });
  }
  console.log('✅ Demo users seeded successfully');

  // Seed workers
  const workerDefs = [
    { employeeId: 'W-001', name: 'Mohan Kumar', role: 'Spinner Operator', department: 'Production', shift: 'Morning', phone: '+91 98100 11001', dailyWage: 65000, joinDate: '2021-03-15' },
    { employeeId: 'W-002', name: 'Suresh Patil', role: 'Spinner Operator', department: 'Production', shift: 'Morning', phone: '+91 98100 11002', dailyWage: 65000, joinDate: '2020-07-01' },
    { employeeId: 'W-003', name: 'Anil Verma', role: 'Weaver', department: 'Production', shift: 'Morning', phone: '+91 98100 11003', dailyWage: 70000, joinDate: '2019-11-10' },
    { employeeId: 'W-004', name: 'Neha Shah', role: 'Quality Inspector', department: 'QC', shift: 'Morning', phone: '+91 98100 11004', dailyWage: 75000, joinDate: '2022-01-20' },
    { employeeId: 'W-005', name: 'Priya Rao', role: 'Finisher', department: 'Production', shift: 'Afternoon', phone: '+91 98100 11005', dailyWage: 62000, joinDate: '2021-08-05' },
    { employeeId: 'W-006', name: 'Ravi Mehta', role: 'Weaver', department: 'Production', shift: 'Morning', phone: '+91 98100 11006', dailyWage: 70000, joinDate: '2020-02-14' },
    { employeeId: 'W-007', name: 'Sanjay Tiwari', role: 'Dyer', department: 'Production', shift: 'Morning', phone: '+91 98100 11007', dailyWage: 68000, joinDate: '2021-06-18' },
    { employeeId: 'W-008', name: 'Deepak Singh', role: 'Store Keeper', department: 'Store', shift: 'Morning', phone: '+91 98100 11008', dailyWage: 72000, joinDate: '2018-09-01' },
    { employeeId: 'W-SUP-01', name: 'Arvind Kumar', role: 'Production Supervisor', department: 'Production', shift: 'Morning', phone: '+91 98765 11223', dailyWage: 120000, joinDate: '2019-06-01' },
    // W-009: New worker with NO wage records for empty-state verification
    { employeeId: 'W-009', name: 'Ramesh Patel', role: 'Helper', department: 'Production', shift: 'Morning', phone: '+91 98100 11009', dailyWage: 50000, joinDate: '2026-10-01' },
  ];

  const dbWorkers = [];
  for (const w of workerDefs) {
    const upserted = await prisma.worker.upsert({
      where: { employeeId: w.employeeId },
      update: {
        name: w.name,
        role: w.role,
        department: w.department,
        shift: w.shift,
        phone: w.phone,
        dailyWage: w.dailyWage,
        wageBasis: WageBasis.DAILY,
        isActive: true,
      },
      create: {
        employeeId: w.employeeId,
        name: w.name,
        role: w.role,
        department: w.department,
        shift: w.shift,
        phone: w.phone,
        dailyWage: w.dailyWage,
        wageBasis: WageBasis.DAILY,
        joinDate: new Date(w.joinDate),
        isActive: true,
      },
    });
    dbWorkers.push(upserted);
  }
  console.log(`✅ ${dbWorkers.length} workers seeded`);

  // Months to seed: Multi-year from Nov 2025 to Oct 2026
  const monthsData = [
    { year: 2025, month: 11, daysFactor: 0.92, otHours: 4, deductions: 0 },
    { year: 2025, month: 12, daysFactor: 1.00, otHours: 8, deductions: 50000 },
    { year: 2026, month: 1,  daysFactor: 0.96, otHours: 4, deductions: 0 },
    { year: 2026, month: 2,  daysFactor: 0.88, otHours: 0, deductions: 25000 },
    { year: 2026, month: 3,  daysFactor: 0.96, otHours: 6, deductions: 0 },
    { year: 2026, month: 4,  daysFactor: 0.96, otHours: 5, deductions: 0 },
    { year: 2026, month: 5,  daysFactor: 0.92, otHours: 2, deductions: 0 },
    { year: 2026, month: 6,  daysFactor: 0.96, otHours: 4, deductions: 0 },
    { year: 2026, month: 7,  daysFactor: 1.00, otHours: 7, deductions: 50000 },
    { year: 2026, month: 8,  daysFactor: 0.96, otHours: 3, deductions: 0 },
    { year: 2026, month: 9,  daysFactor: 0.96, otHours: 5, deductions: 0 },
    { year: 2026, month: 10, daysFactor: 0.92, otHours: 6, deductions: 0 },
  ];

  let wageRecordsCount = 0;
  // Seed wage records for all workers EXCEPT W-009 (which stays empty for testing)
  for (const worker of dbWorkers) {
    if (worker.employeeId === 'W-009') continue;

    const standardDaysInMonth = 26; // approx working days
    const ratePerDayPaise = worker.dailyWage || 65000;
    const hourlyRatePaise = Math.round((ratePerDayPaise / 8) * 1.5);

    for (const m of monthsData) {
      const daysPresent = Math.round(standardDaysInMonth * m.daysFactor);
      const grossWage = daysPresent * ratePerDayPaise;
      const overtime = m.otHours * hourlyRatePaise;
      const deductions = m.deductions;
      const netWage = grossWage + overtime - deductions;

      await prisma.wageRecord.upsert({
        where: {
          unique_worker_month_wage: {
            workerId: worker.id,
            month: m.month,
            year: m.year,
          },
        },
        update: {
          daysPresent,
          grossWage,
          overtime,
          deductions,
          netWage,
          isLocked: m.year < 2026 || m.month < 10,
        },
        create: {
          workerId: worker.id,
          month: m.month,
          year: m.year,
          daysPresent,
          grossWage,
          overtime,
          deductions,
          netWage,
          isLocked: m.year < 2026 || m.month < 10,
        },
      });
      wageRecordsCount++;
    }
  }

  console.log(`✅ ${wageRecordsCount} wage records seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
