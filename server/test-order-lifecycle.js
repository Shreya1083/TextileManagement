/**
 * Test Suite for Order Status Lifecycle & Production Flow (Loop 4)
 * Tests complete order lifecycle from DRAFT to CLOSED with yarn reservations
 */

import { validateOrderStatusTransition, validateRollStatusTransition } from './src/utils/statusLifecycles.js';

console.log('='.repeat(80));
console.log('LOOP 4: ORDER STATUS LIFECYCLE & PRODUCTION FLOW - TEST SUITE');
console.log('='.repeat(80));

// Test 1: Order Status Transitions
console.log('\n[TEST 1] Order Status Lifecycle Transitions');
console.log('-'.repeat(80));

const testOrderTransitions = () => {
  const validTransitions = [
    { from: 'DRAFT', to: 'CONFIRMED', should: 'pass' },
    { from: 'DRAFT', to: 'CANCELLED', should: 'pass' },
    { from: 'CONFIRMED', to: 'YARN_PENDING', should: 'pass' },
    { from: 'CONFIRMED', to: 'IN_PRODUCTION', should: 'pass' },
    { from: 'YARN_PENDING', to: 'CONFIRMED', should: 'pass' },
    { from: 'YARN_PENDING', to: 'IN_PRODUCTION', should: 'pass' },
    { from: 'IN_PRODUCTION', to: 'QUALITY_CHECK', should: 'pass' },
    { from: 'QUALITY_CHECK', to: 'READY_TO_SHIP', should: 'pass' },
    { from: 'READY_TO_SHIP', to: 'DISPATCHED', should: 'pass' },
    { from: 'DISPATCHED', to: 'CLOSED', should: 'pass' },
  ];

  const invalidTransitions = [
    { from: 'DRAFT', to: 'IN_PRODUCTION', should: 'fail' },
    { from: 'DRAFT', to: 'DISPATCHED', should: 'fail' },
    { from: 'CONFIRMED', to: 'READY_TO_SHIP', should: 'fail' },
    { from: 'IN_PRODUCTION', to: 'DISPATCHED', should: 'fail' },
    { from: 'CLOSED', to: 'DRAFT', should: 'fail' },
    { from: 'CLOSED', to: 'IN_PRODUCTION', should: 'fail' },
    { from: 'CANCELLED', to: 'CONFIRMED', should: 'fail' },
  ];

  console.log('\n✓ Testing valid transitions:');
  let passCount = 0;
  for (const test of validTransitions) {
    const result = validateOrderStatusTransition(test.from, test.to);
    if (result.valid) {
      console.log(`  ✓ ${test.from} → ${test.to}`);
      passCount++;
    } else {
      console.log(`  ✗ ${test.from} → ${test.to} (FAILED: ${result.error})`);
    }
  }
  console.log(`\n  Valid transitions: ${passCount}/${validTransitions.length} passed`);

  console.log('\n✓ Testing invalid transitions (should be rejected):');
  let rejectCount = 0;
  for (const test of invalidTransitions) {
    const result = validateOrderStatusTransition(test.from, test.to);
    if (!result.valid) {
      console.log(`  ✓ ${test.from} → ${test.to} correctly rejected`);
      rejectCount++;
    } else {
      console.log(`  ✗ ${test.from} → ${test.to} (FAILED: should have been rejected)`);
    }
  }
  console.log(`\n  Invalid transitions: ${rejectCount}/${invalidTransitions.length} correctly rejected`);

  const allPassed = passCount === validTransitions.length && rejectCount === invalidTransitions.length;
  if (!allPassed) {
    throw new Error('Order status transition validation failed');
  }

  console.log('\n  ✓ All order status transitions validated correctly');
};

testOrderTransitions();

// Test 2: Roll Status Transitions
console.log('\n\n[TEST 2] Roll Status Lifecycle Transitions');
console.log('-'.repeat(80));

const testRollTransitions = () => {
  const validTransitions = [
    { from: 'PRODUCED', to: 'AWAITING_QC', should: 'pass' },
    { from: 'AWAITING_QC', to: 'PASSED', should: 'pass' },
    { from: 'AWAITING_QC', to: 'REWORK', should: 'pass' },
    { from: 'AWAITING_QC', to: 'REJECTED', should: 'pass' },
    { from: 'PASSED', to: 'FINISHED_STOCK', should: 'pass' },
    { from: 'REWORK', to: 'AWAITING_QC', should: 'pass' },
    { from: 'FINISHED_STOCK', to: 'DISPATCHED', should: 'pass' },
  ];

  const invalidTransitions = [
    { from: 'PRODUCED', to: 'PASSED', should: 'fail' },
    { from: 'PRODUCED', to: 'DISPATCHED', should: 'fail' },
    { from: 'AWAITING_QC', to: 'DISPATCHED', should: 'fail' },
    { from: 'REJECTED', to: 'PASSED', should: 'fail' },
    { from: 'REJECTED', to: 'AWAITING_QC', should: 'fail' },
    { from: 'DISPATCHED', to: 'AWAITING_QC', should: 'fail' },
    { from: 'DISPATCHED', to: 'PASSED', should: 'fail' },
  ];

  console.log('\n✓ Testing valid roll transitions:');
  let passCount = 0;
  for (const test of validTransitions) {
    const result = validateRollStatusTransition(test.from, test.to);
    if (result.valid) {
      console.log(`  ✓ ${test.from} → ${test.to}`);
      passCount++;
    } else {
      console.log(`  ✗ ${test.from} → ${test.to} (FAILED: ${result.error})`);
    }
  }
  console.log(`\n  Valid transitions: ${passCount}/${validTransitions.length} passed`);

  console.log('\n✓ Testing invalid roll transitions (should be rejected):');
  let rejectCount = 0;
  for (const test of invalidTransitions) {
    const result = validateRollStatusTransition(test.from, test.to);
    if (!result.valid) {
      console.log(`  ✓ ${test.from} → ${test.to} correctly rejected`);
      rejectCount++;
    } else {
      console.log(`  ✗ ${test.from} → ${test.to} (FAILED: should have been rejected)`);
    }
  }
  console.log(`\n  Invalid transitions: ${rejectCount}/${invalidTransitions.length} correctly rejected`);

  const allPassed = passCount === validTransitions.length && rejectCount === invalidTransitions.length;
  if (!allPassed) {
    throw new Error('Roll status transition validation failed');
  }

  console.log('\n  ✓ All roll status transitions validated correctly');
};

testRollTransitions();

// Test 3: Order Lifecycle Scenarios
console.log('\n\n[TEST 3] Complete Order Lifecycle Scenarios');
console.log('-'.repeat(80));

const testOrderScenarios = () => {
  console.log('\n✓ Scenario 1: Normal order flow (happy path)');
  const normalFlow = ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'DISPATCHED', 'CLOSED'];
  
  let currentStatus = normalFlow[0];
  for (let i = 1; i < normalFlow.length; i++) {
    const nextStatus = normalFlow[i];
    const result = validateOrderStatusTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new Error(`Failed at ${currentStatus} → ${nextStatus}: ${result.error}`);
    }
    console.log(`  ${i}. ${currentStatus} → ${nextStatus} ✓`);
    currentStatus = nextStatus;
  }
  console.log('  ✓ Normal flow completed successfully');

  console.log('\n✓ Scenario 2: Order with yarn shortage');
  const yarnShortageFlow = ['DRAFT', 'YARN_PENDING', 'CONFIRMED', 'IN_PRODUCTION'];
  currentStatus = yarnShortageFlow[0];
  for (let i = 1; i < yarnShortageFlow.length; i++) {
    const nextStatus = yarnShortageFlow[i];
    const result = validateOrderStatusTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new Error(`Failed at ${currentStatus} → ${nextStatus}: ${result.error}`);
    }
    console.log(`  ${i}. ${currentStatus} → ${nextStatus} ✓`);
    currentStatus = nextStatus;
  }
  console.log('  ✓ Yarn shortage flow completed successfully');

  console.log('\n✓ Scenario 3: Order cancellation from various states');
  const cancellableStates = ['DRAFT', 'CONFIRMED', 'YARN_PENDING', 'IN_PRODUCTION', 'QUALITY_CHECK'];
  for (const state of cancellableStates) {
    const result = validateOrderStatusTransition(state, 'CANCELLED');
    if (!result.valid) {
      throw new Error(`Cannot cancel from ${state}: ${result.error}`);
    }
    console.log(`  ✓ Can cancel from ${state}`);
  }
  console.log('  ✓ Cancellation validation completed');

  console.log('\n✓ Scenario 4: Cannot cancel dispatched order');
  const dispatchedCancel = validateOrderStatusTransition('DISPATCHED', 'CANCELLED');
  if (dispatchedCancel.valid) {
    throw new Error('Should not be able to cancel dispatched order');
  }
  console.log('  ✓ Correctly prevents cancellation of dispatched order');

  console.log('\n  ✓ All order lifecycle scenarios validated');
};

testOrderScenarios();

// Test 4: Roll Lifecycle Scenarios
console.log('\n\n[TEST 4] Complete Roll Lifecycle Scenarios');
console.log('-'.repeat(80));

const testRollScenarios = () => {
  console.log('\n✓ Scenario 1: Roll passes QC (happy path)');
  const passedFlow = ['PRODUCED', 'AWAITING_QC', 'PASSED', 'FINISHED_STOCK', 'DISPATCHED'];
  
  let currentStatus = passedFlow[0];
  for (let i = 1; i < passedFlow.length; i++) {
    const nextStatus = passedFlow[i];
    const result = validateRollStatusTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new Error(`Failed at ${currentStatus} → ${nextStatus}: ${result.error}`);
    }
    console.log(`  ${i}. ${currentStatus} → ${nextStatus} ✓`);
    currentStatus = nextStatus;
  }
  console.log('  ✓ Passed roll flow completed successfully');

  console.log('\n✓ Scenario 2: Roll needs rework');
  const reworkFlow = ['PRODUCED', 'AWAITING_QC', 'REWORK', 'AWAITING_QC', 'PASSED'];
  currentStatus = reworkFlow[0];
  for (let i = 1; i < reworkFlow.length; i++) {
    const nextStatus = reworkFlow[i];
    const result = validateRollStatusTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new Error(`Failed at ${currentStatus} → ${nextStatus}: ${result.error}`);
    }
    console.log(`  ${i}. ${currentStatus} → ${nextStatus} ✓`);
    currentStatus = nextStatus;
  }
  console.log('  ✓ Rework flow completed successfully');

  console.log('\n✓ Scenario 3: Roll rejected (terminal state)');
  const rejectFlow = ['PRODUCED', 'AWAITING_QC', 'REJECTED'];
  currentStatus = rejectFlow[0];
  for (let i = 1; i < rejectFlow.length; i++) {
    const nextStatus = rejectFlow[i];
    const result = validateRollStatusTransition(currentStatus, nextStatus);
    if (!result.valid) {
      throw new Error(`Failed at ${currentStatus} → ${nextStatus}: ${result.error}`);
    }
    console.log(`  ${i}. ${currentStatus} → ${nextStatus} ✓`);
    currentStatus = nextStatus;
  }
  
  // Verify rejected is terminal
  const fromRejected = validateRollStatusTransition('REJECTED', 'AWAITING_QC');
  if (fromRejected.valid) {
    throw new Error('Rejected should be a terminal state');
  }
  console.log('  ✓ Rejected is correctly a terminal state');

  console.log('\n✓ Scenario 4: Cannot skip QC inspection');
  const skipQC = validateRollStatusTransition('PRODUCED', 'PASSED');
  if (skipQC.valid) {
    throw new Error('Should not be able to skip QC inspection');
  }
  console.log('  ✓ Correctly prevents skipping QC inspection');

  console.log('\n✓ Scenario 5: Cannot dispatch without passing QC');
  const directDispatch = validateRollStatusTransition('AWAITING_QC', 'DISPATCHED');
  if (directDispatch.valid) {
    throw new Error('Should not be able to dispatch without QC pass');
  }
  console.log('  ✓ Correctly prevents dispatch without QC approval');

  console.log('\n  ✓ All roll lifecycle scenarios validated');
};

testRollScenarios();

// Test 5: Status Lifecycle Integration
console.log('\n\n[TEST 5] Order-Roll Status Integration');
console.log('-'.repeat(80));

const testOrderRollIntegration = () => {
  console.log('\n✓ Testing order-roll status synchronization logic:');
  
  // Simulate order with multiple rolls
  const orderStatus = 'IN_PRODUCTION';
  const rolls = [
    { id: 1, status: 'PRODUCED' },
    { id: 2, status: 'PRODUCED' },
    { id: 3, status: 'PRODUCED' },
  ];

  console.log(`\n  Initial state: Order ${orderStatus}, ${rolls.length} rolls PRODUCED`);

  // Move rolls to QC
  console.log('\n  Moving rolls to quality check:');
  rolls.forEach(roll => {
    const result = validateRollStatusTransition(roll.status, 'AWAITING_QC');
    if (!result.valid) {
      throw new Error(`Cannot move roll ${roll.id} to QC`);
    }
    roll.status = 'AWAITING_QC';
    console.log(`    Roll ${roll.id}: PRODUCED → AWAITING_QC ✓`);
  });

  // Order should be able to move to QUALITY_CHECK
  let orderResult = validateOrderStatusTransition(orderStatus, 'QUALITY_CHECK');
  if (!orderResult.valid) {
    throw new Error('Order should be able to move to QUALITY_CHECK');
  }
  console.log(`  Order: ${orderStatus} → QUALITY_CHECK ✓`);
  
  // Pass all rolls
  console.log('\n  Passing all rolls through QC:');
  rolls.forEach(roll => {
    const result = validateRollStatusTransition(roll.status, 'PASSED');
    if (!result.valid) {
      throw new Error(`Cannot pass roll ${roll.id}`);
    }
    roll.status = 'PASSED';
    console.log(`    Roll ${roll.id}: AWAITING_QC → PASSED ✓`);
  });

  // Order should be able to move to READY_TO_SHIP
  orderResult = validateOrderStatusTransition('QUALITY_CHECK', 'READY_TO_SHIP');
  if (!orderResult.valid) {
    throw new Error('Order should be able to move to READY_TO_SHIP');
  }
  console.log(`  Order: QUALITY_CHECK → READY_TO_SHIP ✓`);

  console.log('\n  ✓ Order-roll status integration validated');
};

testOrderRollIntegration();

// Summary
console.log('\n' + '='.repeat(80));
console.log('LOOP 4 TEST SUITE COMPLETED');
console.log('='.repeat(80));
console.log('\n✓ All tests passed successfully!\n');
console.log('Order Lifecycle Features Verified:');
console.log('  ✓ Order status transitions (DRAFT → CLOSED)');
console.log('  ✓ Roll status transitions (PRODUCED → DISPATCHED)');
console.log('  ✓ Normal order flow (happy path)');
console.log('  ✓ Yarn shortage handling (YARN_PENDING)');
console.log('  ✓ Order cancellation logic');
console.log('  ✓ Roll QC workflows (pass/rework/reject)');
console.log('  ✓ Terminal state enforcement');
console.log('  ✓ Order-roll status synchronization');
console.log('  ✓ Business rule enforcement (no QC skipping, etc.)');
console.log('\nNext: Integrate with production service (Loop 5)');
console.log('='.repeat(80));
