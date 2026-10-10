/**
 * Comprehensive Business Rules Test Suite
 * Tests all constraints and business logic implemented in Loop 2
 */

import { prisma } from './src/config/database.js';
import BusinessRules, { BusinessRuleError } from './src/utils/businessRules.js';

// Test configuration
const testConfig = {
  testSupplierId: null,
  testYarnTypeId: null,
  testBuyerId: null,
  testFabricTypeId: null,
  testOrderId: null,
  testMachineId: null,
  testWorkerId: null,
  testShiftId: null,
};

class BusinessRulesTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Testing: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name} - PASSED\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}\n`);
    }
  }

  // Setup test data
  async setupTestData() {
    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: 'Test Supplier',
        contactName: 'John Doe',
        phone: '1234567890',
        isActive: true,
      }
    });
    testConfig.testSupplierId = supplier.id;

    // Create test yarn type
    const yarnType = await prisma.yarnType.create({
      data: {
        name: 'Test Cotton',
        count: '20s',
        color: 'Natural',
        unit: 'kg',
        reorderLevel: 100,
      }
    });
    testConfig.testYarnTypeId = yarnType.id;

    // Create test buyer
    const buyer = await prisma.buyer.create({
      data: {
        name: 'Test Buyer',
        contactPerson: 'Jane Smith',
        phone: '9876543210',
        email: 'buyer@test.com',
        isActive: true,
      }
    });
    testConfig.testBuyerId = buyer.id;

    // Create test fabric type
    const fabricType = await prisma.fabricType.create({
      data: {
        name: 'Test Cotton Fabric',
        yarnType: 'Cotton',
        yarnPerMetre: 2.5,
        gsm: 150,
        width: 45,
      }
    });
    testConfig.testFabricTypeId = fabricType.id;

    // Create test machine
    const machine = await prisma.machine.create({
      data: {
        name: 'Test Machine 1',
        machineCode: 'TM001',
        stage: 'WEAVING',
        status: 'IDLE',
      }
    });
    testConfig.testMachineId = machine.id;

    // Create test shift
    const shift = await prisma.shift.create({
      data: {
        name: 'Test Shift',
        startTime: '08:00',
        endTime: '16:00',
      }
    });
    testConfig.testShiftId = shift.id;

    // Create test worker
    const worker = await prisma.worker.create({
      data: {
        employeeId: 'TW001',
        name: 'Test Worker',
        wageBasis: 'DAILY',
        dailyWage: 50000, // 500 rupees in paise
        isActive: true,
      }
    });
    testConfig.testWorkerId = worker.id;

    console.log('✅ Test data setup completed\n');
  }

  // Cleanup test data
  async cleanupTestData() {
    await prisma.worker.deleteMany({ where: { employeeId: { startsWith: 'TW' } } });
    await prisma.shift.deleteMany({ where: { name: { startsWith: 'Test' } } });
    await prisma.machine.deleteMany({ where: { machineCode: { startsWith: 'TM' } } });
    await prisma.fabricType.deleteMany({ where: { name: { startsWith: 'Test' } } });
    await prisma.buyer.deleteMany({ where: { name: { startsWith: 'Test' } } });
    await prisma.yarnType.deleteMany({ where: { name: { startsWith: 'Test' } } });
    await prisma.supplier.deleteMany({ where: { name: { startsWith: 'Test' } } });
    console.log('🧹 Test data cleanup completed\n');
  }

  // Test 1: GRN Quantity Validation
  async testGRNQuantityValidation() {
    // Test positive quantity (should pass)
    BusinessRules.InventoryRules.validateGRNQuantity(100);

    // Test zero quantity (should fail)
    let failed = false;
    try {
      BusinessRules.InventoryRules.validateGRNQuantity(0);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'GRN_QUANTITY_POSITIVE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Zero quantity validation failed');

    // Test negative quantity (should fail)
    failed = false;
    try {
      BusinessRules.InventoryRules.validateGRNQuantity(-10);
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        failed = true;
      }
    }
    if (!failed) throw new Error('Negative quantity validation failed');
  }

  // Test 2: Challan Uniqueness per Supplier
  async testChallanUniqueness() {
    const challanNumber = 'TEST001';
    
    // Create first GRN with challan
    await prisma.gateEntry.create({
      data: {
        grnNumber: 'GRN001',
        supplierId: testConfig.testSupplierId,
        yarnTypeId: testConfig.testYarnTypeId,
        lotNumber: 'LOT001',
        quantity: 100,
        challanNumber,
        receivedBy: 'system', // Using system user
      }
    });

    // Try to create another GRN with same challan for same supplier (should fail)
    let failed = false;
    try {
      await BusinessRules.InventoryRules.validateChallanUniqueness(
        testConfig.testSupplierId, 
        challanNumber
      );
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'CHALLAN_UNIQUE_PER_SUPPLIER') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Challan uniqueness validation failed');

    // Cleanup
    await prisma.gateEntry.deleteMany({ where: { challanNumber } });
  }

  // Test 3: Order Quantity and Deadline Validation
  async testOrderValidation() {
    // Test valid order data
    const validOrder = {
      quantity: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
    BusinessRules.OrderRules.validateOrder(validOrder);

    // Test zero quantity (should fail)
    let failed = false;
    try {
      BusinessRules.OrderRules.validateOrder({ quantity: 0, deadline: validOrder.deadline });
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'ORDER_QUANTITY_POSITIVE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Zero order quantity validation failed');

    // Test past deadline (should fail) 
    failed = false;
    try {
      BusinessRules.OrderRules.validateOrder({ 
        quantity: 100, 
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'ORDER_DEADLINE_FUTURE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Past deadline validation failed');
  }

  // Test 4: Order Status Lifecycle
  async testOrderStatusTransitions() {
    // Test valid transition
    BusinessRules.OrderRules.validateStatusTransition('DRAFT', 'CONFIRMED');

    // Test invalid transition (should fail)
    let failed = false;
    try {
      BusinessRules.OrderRules.validateStatusTransition('DRAFT', 'DISPATCHED');
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'INVALID_STATUS_TRANSITION') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Invalid status transition validation failed');

    // Test terminal state (should fail)
    failed = false;
    try {
      BusinessRules.OrderRules.validateStatusTransition('CLOSED', 'CONFIRMED');
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        failed = true;
      }
    }
    if (!failed) throw new Error('Terminal state validation failed');
  }

  // Test 5: Machine Assignment Uniqueness
  async testMachineAssignmentUniqueness() {
    // Create first assignment
    const assignment1 = await prisma.workAssignment.create({
      data: {
        orderId: testConfig.testOrderId || 'temp',
        machineId: testConfig.testMachineId,
        stage: 'WEAVING',
        plannedQuantity: 100,
        startDate: new Date(),
        assignedBy: 'system',
        status: 'ACTIVE',
      }
    });

    // Try to create second active assignment (should fail)
    let failed = false;
    try {
      await BusinessRules.OrderRules.validateMachineAssignment(testConfig.testMachineId);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'ONE_ACTIVE_ASSIGNMENT_PER_MACHINE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Machine assignment uniqueness validation failed');

    // Cleanup
    await prisma.workAssignment.delete({ where: { id: assignment1.id } });
  }

  // Test 6: Production Output Validation
  async testProductionOutputValidation() {
    // Test valid output
    BusinessRules.OrderRules.validateProductionOutput(100, 5);

    // Test negative output (should fail)
    let failed = false;
    try {
      BusinessRules.OrderRules.validateProductionOutput(-10, 5);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'OUTPUT_NON_NEGATIVE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Negative output validation failed');

    // Test negative waste (should fail)
    failed = false;
    try {
      BusinessRules.OrderRules.validateProductionOutput(100, -5);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'WASTE_NON_NEGATIVE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Negative waste validation failed');
  }

  // Test 7: Roll Number Uniqueness
  async testRollNumberUniqueness() {
    const rollNumber = 'TEST-ROLL-001';

    // Create first roll
    const roll1 = await prisma.fabricRoll.create({
      data: {
        rollNumber,
        orderId: testConfig.testOrderId || 'temp',
        length: 100,
        productionDate: new Date(),
        status: 'PRODUCED',
      }
    });

    // Try to create second roll with same number (should fail)
    let failed = false;
    try {
      await BusinessRules.OrderRules.validateRollNumber(rollNumber);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'ROLL_NUMBER_UNIQUE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Roll number uniqueness validation failed');

    // Cleanup
    await prisma.fabricRoll.delete({ where: { id: roll1.id } });
  }

  // Test 8: Inspection Result Validation
  async testInspectionResultValidation() {
    // Test valid inspection without reason
    BusinessRules.QualityRules.validateInspectionResult('PASSED', null);

    // Test rejection without reason (should fail)
    let failed = false;
    try {
      BusinessRules.QualityRules.validateInspectionResult('REJECTED', null);
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'INSPECTION_REASON_REQUIRED') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Rejection reason validation failed');

    // Test rework without reason (should fail)
    failed = false;
    try {
      BusinessRules.QualityRules.validateInspectionResult('REWORK', '');
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        failed = true;
      }
    }
    if (!failed) throw new Error('Rework reason validation failed');
  }

  // Test 9: Attendance Uniqueness
  async testAttendanceUniqueness() {
    const attendanceData = {
      workerId: testConfig.testWorkerId,
      shiftId: testConfig.testShiftId,
      date: new Date(),
      status: 'PRESENT',
    };

    // Create first attendance
    const attendance1 = await prisma.attendance.create({
      data: attendanceData,
    });

    // Try to create duplicate (should fail)
    let failed = false;
    try {
      await BusinessRules.AttendanceRules.validateAttendanceUniqueness(
        attendanceData.workerId,
        attendanceData.date,
        attendanceData.shiftId
      );
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'ATTENDANCE_ALREADY_EXISTS') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Attendance uniqueness validation failed');

    // Cleanup
    await prisma.attendance.delete({ where: { id: attendance1.id } });
  }

  // Test 10: Money Validation
  async testMoneyValidation() {
    // Test valid money (integer paise)
    BusinessRules.MoneyRules.validateMoney(50000, 'amount');

    // Test decimal money (should fail)
    let failed = false;
    try {
      BusinessRules.MoneyRules.validateMoney(500.50, 'amount');
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'MONEY_INTEGER_PAISE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Money decimal validation failed');

    // Test negative money (should fail)
    failed = false;
    try {
      BusinessRules.MoneyRules.validateMoney(-100, 'amount');
    } catch (error) {
      if (error instanceof BusinessRuleError && error.rule === 'MONEY_NON_NEGATIVE') {
        failed = true;
      }
    }
    if (!failed) throw new Error('Negative money validation failed');
  }

  // Test 11: Stock Calculation
  async testStockCalculations() {
    // Test available stock calculation
    const available = BusinessRules.InventoryRules.calculateAvailableStock(1000, 200);
    if (available !== 800) {
      throw new Error(`Expected available stock 800, got ${available}`);
    }

    // Test negative available (should return 0)
    const negativeAvailable = BusinessRules.InventoryRules.calculateAvailableStock(100, 200);
    if (negativeAvailable !== 0) {
      throw new Error(`Expected available stock 0, got ${negativeAvailable}`);
    }

    // Test low stock check
    const isLow = BusinessRules.InventoryRules.isLowStock(50, 100);
    if (!isLow) {
      throw new Error('Low stock check failed');
    }

    // Test yarn requirement calculation
    const yarnRequired = BusinessRules.InventoryRules.calculateYarnRequired(100, 2.5);
    if (yarnRequired !== 250) {
      throw new Error(`Expected yarn required 250, got ${yarnRequired}`);
    }
  }

  async runAllTests() {
    console.log('🔍 Starting Business Rules Test Suite');
    console.log('===================================\n');

    try {
      await this.setupTestData();

      await this.test('GRN Quantity Validation', () => this.testGRNQuantityValidation());
      await this.test('Challan Uniqueness per Supplier', () => this.testChallanUniqueness());
      await this.test('Order Validation', () => this.testOrderValidation());
      await this.test('Order Status Transitions', () => this.testOrderStatusTransitions());
      await this.test('Machine Assignment Uniqueness', () => this.testMachineAssignmentUniqueness());
      await this.test('Production Output Validation', () => this.testProductionOutputValidation());
      await this.test('Roll Number Uniqueness', () => this.testRollNumberUniqueness());
      await this.test('Inspection Result Validation', () => this.testInspectionResultValidation());
      await this.test('Attendance Uniqueness', () => this.testAttendanceUniqueness());
      await this.test('Money Validation', () => this.testMoneyValidation());
      await this.test('Stock Calculations', () => this.testStockCalculations());

      await this.cleanupTestData();
    } catch (error) {
      console.error('Test setup/cleanup error:', error);
      await this.cleanupTestData();
    }

    // Final results
    console.log('\n🏁 Business Rules Test Results');
    console.log('===============================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests.filter(t => t.status === 'FAILED').forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`);
      });
    }

    const score = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100);
    console.log(`\n🎯 Business Rules Compliance: ${score}%`);
    
    if (score >= 95) {
      console.log('🎉 Excellent! Business rules are comprehensively implemented.');
    } else if (score >= 80) {
      console.log('👍 Good! Most business rules are working correctly.');
    } else {
      console.log('⚠️  Warning! Critical business rules need attention.');
    }
  }
}

// Run the business rules test suite
const tester = new BusinessRulesTester();
tester.runAllTests().catch(console.error);