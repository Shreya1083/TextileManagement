/**
 * Loop 7: HR & Payroll Logic Test Suite
 * Tests attendance validation, wage calculation, corrections, and audit trails
 */

import { PrismaClient } from '@prisma/client';
import * as hrService from './src/services/hr.service.js';
import { BusinessRuleError } from './src/utils/businessRules.js';

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Test helper functions
function assert(condition, testName, errorMessage = '') {
  if (condition) {
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS' });
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
  } else {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: errorMessage });
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    if (errorMessage) console.log(`  ${colors.red}Error: ${errorMessage}${colors.reset}`);
  }
}

async function assertThrows(fn, testName, expectedError = null) {
  try {
    await fn();
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: 'Expected error but none thrown' });
    console.log(`${colors.red}✗${colors.reset} ${testName} - Expected error but none thrown`);
    return false;
  } catch (error) {
    if (expectedError && !error.message.includes(expectedError)) {
      testResults.failed++;
      testResults.tests.push({ name: testName, status: 'FAIL', error: `Expected "${expectedError}" but got "${error.message}"` });
      console.log(`${colors.red}✗${colors.reset} ${testName} - Wrong error: ${error.message}`);
      return false;
    }
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS' });
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    return true;
  }
}

// Test data setup
let testUser, testWorker1, testWorker2, testShift;

async function setupTestData() {
  console.log(`\n${colors.blue}${colors.bold}Setting up test data...${colors.reset}`);

  // Clean up any leftover test data first
  await prisma.user.deleteMany({ where: { email: 'hr.test@textile.com' } }).catch(() => {});
  await prisma.worker.deleteMany({ where: { employeeId: { in: ['EMP001', 'EMP002'] } } }).catch(() => {});
  await prisma.shift.deleteMany({ where: { name: 'Day Shift' } }).catch(() => {});

  // Create test user
  testUser = await prisma.user.create({
    data: {
      name: 'HR Test User',
      email: 'hr.test@textile.com',
      password: 'hashedpassword',
      role: 'ACCOUNTS',
      isActive: true,
    },
  });
  console.log(`Created test user: ${testUser.email}`);

  // Create test shift
  testShift = await prisma.shift.create({
    data: {
      name: 'Day Shift',
      startTime: '08:00:00',
      endTime: '17:00:00',
      isActive: true,
    },
  });
  console.log(`Created test shift: ${testShift.name}`);

  // Create test workers
  testWorker1 = await prisma.worker.create({
    data: {
      name: 'Ramesh Kumar',
      employeeId: 'EMP001',
      role: 'OPERATOR',
      wageBasis: 'DAILY',
      dailyWage: 50000, // 500 rupees in paise
      joinDate: new Date('2025-01-01'),
      isActive: true,
    },
  });
  console.log(`Created test worker 1: ${testWorker1.name}`);

  testWorker2 = await prisma.worker.create({
    data: {
      name: 'Suresh Sharma',
      employeeId: 'EMP002',
      role: 'OPERATOR',
      wageBasis: 'DAILY',
      dailyWage: 60000, // 600 rupees in paise
      joinDate: new Date('2025-01-01'),
      isActive: true,
    },
  });
  console.log(`Created test worker 2: ${testWorker2.name}`);
}

async function cleanupTestData() {
  console.log(`\n${colors.blue}Cleaning up test data...${colors.reset}`);

  try {
    // Delete in reverse order of dependencies
    if (testWorker1 && testWorker2) {
      await prisma.wageRecord.deleteMany({ where: { workerId: { in: [testWorker1.id, testWorker2.id] } } });
      await prisma.attendance.deleteMany({ where: { workerId: { in: [testWorker1.id, testWorker2.id] } } });
      await prisma.worker.deleteMany({ where: { id: { in: [testWorker1.id, testWorker2.id] } } });
    }
    if (testShift) {
      await prisma.shift.delete({ where: { id: testShift.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    console.log('Test data cleaned up');
  } catch (error) {
    console.log('Cleanup error (non-fatal):', error.message);
  }
}

// ==============================================
// TEST SUITE
// ==============================================

async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}  Loop 7: HR & Payroll Logic Test Suite${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    await setupTestData();

    // Test 1: Mark attendance successfully
    console.log(`\n${colors.yellow}Test Group 1: Attendance Marking${colors.reset}`);
    const attendanceDate = new Date('2026-10-08');
    const attendance1 = await hrService.markAttendance({
      workerId: testWorker1.id,
      shiftId: testShift.id,
      date: attendanceDate,
      status: 'PRESENT',
      overtimeHours: 2,
    }, testUser.id);
    assert(attendance1 && attendance1.status === 'PRESENT', 'Should mark attendance successfully');
    assert(attendance1.overtimeHours === 2, 'Should record overtime hours');

    // Test 2: Duplicate attendance should be idempotent (update)
    const attendance1Updated = await hrService.markAttendance({
      workerId: testWorker1.id,
      shiftId: testShift.id,
      date: attendanceDate,
      status: 'PRESENT',
      overtimeHours: 3, // Changed
    }, testUser.id);
    assert(attendance1Updated.id === attendance1.id, 'Should update existing attendance (idempotent)');
    assert(attendance1Updated.overtimeHours === 3, 'Should update overtime hours');

    // Test 3: Bulk attendance marking
    console.log(`\n${colors.yellow}Test Group 2: Bulk Attendance${colors.reset}`);
    const bulkRecords = [
      {
        workerId: testWorker2.id,
        shiftId: testShift.id,
        date: attendanceDate,
        status: 'PRESENT',
        overtimeHours: 1,
      },
      {
        workerId: testWorker1.id,
        shiftId: testShift.id,
        date: new Date('2026-10-09'),
        status: 'PRESENT',
        overtimeHours: 0,
      },
    ];
    const bulkResults = await hrService.bulkMarkAttendance(bulkRecords, testUser.id);
    assert(bulkResults.length === 2, 'Should process all bulk records');
    assert(bulkResults.every(r => r.success), 'All bulk records should succeed');

    // Test 4: Attendance correction validation - missing reason
    console.log(`\n${colors.yellow}Test Group 3: Attendance Corrections${colors.reset}`);
    await assertThrows(
      async () => {
        await hrService.updateAttendance(
          attendance1.id,
          { status: 'ABSENT' }, // No correctionReason
          testUser.id,
          testUser.id
        );
      },
      'Should reject correction without reason',
      'corrections require a reason'
    );

    // Test 5: Attendance correction validation - missing correctedBy
    await assertThrows(
      async () => {
        await hrService.updateAttendance(
          attendance1.id,
          { status: 'ABSENT', correctionReason: 'Worker was sick' },
          null, // No correctedBy
          testUser.id
        );
      },
      'Should reject correction without correctedBy',
      'corrections require corrector identification'
    );

    // Test 6: Valid attendance correction with audit trail
    const correctedAttendance = await hrService.updateAttendance(
      attendance1.id,
      { 
        status: 'HALF_DAY', 
        overtimeHours: 0,
        correctionReason: 'Worker left early due to medical emergency' 
      },
      testUser.id,
      testUser.id
    );
    assert(correctedAttendance.status === 'HALF_DAY', 'Should update attendance status');
    assert(correctedAttendance.correctedBy === testUser.id, 'Should record corrector');
    assert(correctedAttendance.correctedAt !== null, 'Should record correction timestamp');

    // Test 7: Check audit log for correction
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'Attendance',
        entityId: attendance1.id.toString(),
        action: 'ATTENDANCE_CORRECTION',
      },
      orderBy: { createdAt: 'desc' },
    });
    assert(auditLog !== null, 'Should create audit log for correction');
    assert(auditLog.notes.includes('medical emergency'), 'Audit log should contain reason');

    // Test 8: Mark more attendance for wage calculation
    console.log(`\n${colors.yellow}Test Group 4: Wage Sheet Generation${colors.reset}`);
    const month = 10;
    const year = 2026;
    
    // Mark multiple days of attendance
    for (let day = 1; day <= 5; day++) {
      await hrService.markAttendance({
        workerId: testWorker1.id,
        shiftId: testShift.id,
        date: new Date(2026, 9, day), // October 2026
        status: 'PRESENT',
        overtimeHours: day % 2, // Alternate overtime
      }, testUser.id);

      await hrService.markAttendance({
        workerId: testWorker2.id,
        shiftId: testShift.id,
        date: new Date(2026, 9, day),
        status: 'PRESENT',
        overtimeHours: 0,
      }, testUser.id);
    }

    // Test 9: Generate wage sheet with business rule validation
    const wageRecords = await hrService.generateWageSheet(month, year, testUser.id);
    assert(wageRecords.length === 2, 'Should generate wage records for all active workers');
    
    const worker1Wage = wageRecords.find(r => r.workerId === testWorker1.id);
    assert(worker1Wage !== undefined, 'Should have wage record for worker 1');
    assert(worker1Wage.daysPresent === 6, 'Should calculate correct days present (5 + 1 from earlier)'); // 5 new + 1 corrected to HALF_DAY
    assert(worker1Wage.isLocked === false, 'New wage record should not be locked');

    // Test 10: Money stored as integer paise
    assert(Number.isInteger(worker1Wage.grossWage), 'Gross wage should be integer paise');
    assert(Number.isInteger(worker1Wage.netWage), 'Net wage should be integer paise');
    assert(worker1Wage.grossWage > 0, 'Gross wage should be positive');

    // Test 11: Wage calculation validation
    const expectedGrossWagePaise = testWorker1.dailyWage * worker1Wage.daysPresent;
    assert(
      worker1Wage.grossWage >= expectedGrossWagePaise, 
      'Gross wage should at least equal base wage (may include overtime)'
    );

    // Test 12: Cannot update locked wage record
    console.log(`\n${colors.yellow}Test Group 5: Wage Sheet Locking${colors.reset}`);
    const lockedWage = await hrService.lockWageRecord(worker1Wage.id, testUser.id);
    assert(lockedWage.isLocked === true, 'Should lock wage record');

    await assertThrows(
      async () => {
        await hrService.updateWageRecord(
          worker1Wage.id,
          { netWage: 100000 },
          testUser.id
        );
      },
      'Should reject update to locked wage record',
      'Cannot modify locked wage sheet'
    );

    // Test 13: Unlock requires reason
    await assertThrows(
      async () => {
        await hrService.unlockWageRecord(worker1Wage.id, '', testUser.id);
      },
      'Should reject unlock without reason',
      'Reason is required to unlock'
    );

    // Test 14: Unlock with reason and audit
    const unlockedWage = await hrService.unlockWageRecord(
      worker1Wage.id,
      'Correcting overtime calculation error',
      testUser.id
    );
    assert(unlockedWage.isLocked === false, 'Should unlock wage record');

    const unlockAudit = await prisma.auditLog.findFirst({
      where: {
        entity: 'WageRecord',
        entityId: worker1Wage.id.toString(),
        action: 'WAGE_SHEET_UNLOCKED',
      },
    });
    assert(unlockAudit !== null, 'Should create audit log for unlock');
    assert(unlockAudit.notes.includes('overtime calculation'), 'Unlock audit should contain reason');

    // Test 15: Update unlocked wage record
    const updatedWage = await hrService.updateWageRecord(
      worker1Wage.id,
      { deductions: 5000 }, // Add 50 rupees deduction
      testUser.id
    );
    assert(updatedWage.deductions === 5000, 'Should update deductions');

    // Test 16: Wage sheet generation audit
    console.log(`\n${colors.yellow}Test Group 6: Audit Trail Verification${colors.reset}`);
    const wageSheetAudit = await prisma.auditLog.findFirst({
      where: {
        entity: 'WageRecord',
        action: 'WAGE_SHEET_GENERATED',
      },
    });
    assert(wageSheetAudit !== null, 'Should create audit log for wage sheet generation');
    const metadata = JSON.parse(wageSheetAudit.metadata);
    assert(metadata.workerCount === 2, 'Audit should record worker count');
    assert(metadata.month === month && metadata.year === year, 'Audit should record period');

    // Test 17: Get attendance summary
    console.log(`\n${colors.yellow}Test Group 7: Reporting${colors.reset}`);
    const summary = await hrService.getAttendanceSummary({
      workerId: testWorker1.id,
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2026, 9, 31),
    });
    assert(summary.length === 1, 'Should return summary for one worker');
    assert(summary[0].present >= 5, 'Should count present days correctly');

    // Test 18: Attendance with validation
    console.log(`\n${colors.yellow}Test Group 8: Business Rule Enforcement${colors.reset}`);
    const newAttendance = await hrService.markAttendance({
      workerId: testWorker2.id,
      shiftId: testShift.id,
      date: new Date('2026-10-15'),
      status: 'PRESENT',
      overtimeHours: 0,
    }, testUser.id);
    assert(newAttendance.status === 'PRESENT', 'Should mark new attendance');

    // Test 19: Get all attendance with filters
    const allAttendance = await hrService.getAllAttendance({
      workerId: testWorker1.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-31'),
    });
    assert(allAttendance.attendance.length >= 5, 'Should retrieve filtered attendance');

    // Test 20: Get all wage records
    const allWageRecords = await hrService.getAllWageRecords({
      month,
      year,
    });
    assert(allWageRecords.records.length === 2, 'Should retrieve wage records for the period');

    console.log(`\n${colors.green}${colors.bold}✓ All HR & Payroll tests completed${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Test suite error:${colors.reset}`, error);
    testResults.failed++;
  } finally {
    await cleanupTestData();
  }
}

// ==============================================
// MAIN EXECUTION
// ==============================================

async function main() {
  try {
    await runTests();

    // Print summary
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}Test Summary:${colors.reset}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`${colors.bold}Total: ${testResults.passed + testResults.failed}${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

    if (testResults.failed === 0) {
      console.log(`${colors.green}${colors.bold}🎉 All tests passed! Loop 7 (HR & Payroll Logic) is complete.${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}${colors.bold}❌ Some tests failed. Please review the errors above.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}${colors.bold}Fatal error:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
