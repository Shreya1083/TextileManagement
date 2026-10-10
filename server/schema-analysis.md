# Database Schema Analysis & Business Rules Implementation
## Loop 2: Missing Constraints and Data Integrity Requirements

Based on README Section 8 Business Rules Analysis:

## 1. INVENTORY & YARN CONSTRAINTS

### Missing Implementations:
- [ ] **GRN quantity must be > 0** (Check constraint)
- [ ] **Challan number unique per supplier** (Composite unique constraint) 
- [ ] **Available stock = current - reserved** (Computed/derived values)
- [ ] **Stock movement must have valid reason/reference** (NOT NULL constraints)
- [ ] **PO receipt links to GRN with partial support** (Foreign key + status logic)
- [ ] **Yarn required = order quantity × fabric ratio** (Validation logic)

### Required Schema Changes:
```sql
-- GateEntry constraints
ALTER TABLE gate_entries ADD CONSTRAINT grn_quantity_positive CHECK (quantity > 0);
ALTER TABLE gate_entries ADD CONSTRAINT unique_challan_per_supplier UNIQUE (supplierId, challanNumber);

-- StockMovement constraints  
ALTER TABLE stock_movements ADD CONSTRAINT movement_quantity_nonzero CHECK (quantity != 0);
ALTER TABLE stock_movements ALTER COLUMN referenceType SET NOT NULL;
ALTER TABLE stock_movements ALTER COLUMN referenceId SET NOT NULL;

-- StockBatch computed fields
ALTER TABLE stock_batches ADD COLUMN reservedQuantity INT DEFAULT 0;
ALTER TABLE stock_batches ADD COLUMN availableQuantity INT GENERATED ALWAYS AS (currentStock - reservedQuantity) STORED;
```

## 2. ORDER & PRODUCTION CONSTRAINTS

### Missing Implementations:
- [ ] **Order quantity must be > 0** (Check constraint)
- [ ] **Order status lifecycle enforcement** (CHECK constraint + trigger)
- [ ] **One active assignment per machine** (Unique constraint with condition)
- [ ] **No work assignment to broken machines** (Foreign key + check)
- [ ] **Production output cannot be negative** (Check constraint)
- [ ] **Roll IDs unique and never reused** (Unique constraint + sequence)

### Required Schema Changes:
```sql
-- Order constraints
ALTER TABLE orders ADD CONSTRAINT order_quantity_positive CHECK (quantity > 0);
ALTER TABLE orders ADD CONSTRAINT valid_deadline CHECK (deadline > createdAt);

-- Machine assignment uniqueness
CREATE UNIQUE INDEX unique_active_assignment_per_machine 
ON work_assignments (machineId) WHERE status = 'ACTIVE';

-- Production output validation
ALTER TABLE production_logs ADD CONSTRAINT output_non_negative CHECK (outputQuantity >= 0);
ALTER TABLE production_logs ADD CONSTRAINT waste_non_negative CHECK (wasteQuantity >= 0);

-- Roll ID uniqueness
ALTER TABLE fabric_rolls ADD CONSTRAINT unique_roll_number UNIQUE (rollNumber);
```

## 3. QUALITY & ROLL TRACEABILITY

### Missing Implementations:
- [ ] **Every roll must link to order, machine, assignment** (NOT NULL constraints)
- [ ] **Inspection result mandatory** (NOT NULL constraint)
- [ ] **Rework/reject requires reason** (Conditional NOT NULL)
- [ ] **Only passed rolls in finished stock** (Check constraint)
- [ ] **Inspection changes audited** (Trigger implementation)

### Required Schema Changes:
```sql
-- Fabric roll linking
ALTER TABLE fabric_rolls ALTER COLUMN orderId SET NOT NULL;
ALTER TABLE fabric_rolls ALTER COLUMN workAssignmentId SET NOT NULL;

-- Inspection requirements
ALTER TABLE inspections ALTER COLUMN result SET NOT NULL;
ALTER TABLE inspections ADD CONSTRAINT reject_requires_reason 
  CHECK ((result != 'REJECTED') OR (remarks IS NOT NULL AND LENGTH(remarks) > 0));

-- Roll status validation
ALTER TABLE fabric_rolls ADD CONSTRAINT finished_stock_only_passed 
  CHECK ((status != 'FINISHED_STOCK') OR (status IN ('PASSED', 'RELEASED')));
```

## 4. DISPATCH & INVOICE INTEGRITY

### Missing Implementations:
- [ ] **Roll can only be dispatched once** (Unique constraint)
- [ ] **Dispatch atomic operations** (Transaction enforcement)
- [ ] **Invoice quantity = dispatch quantity** (Validation trigger)
- [ ] **All rolls same buyer/order per dispatch** (Check constraint)
- [ ] **Payment not exceed outstanding balance** (Check constraint)

### Required Schema Changes:
```sql
-- Dispatch roll uniqueness
ALTER TABLE dispatch_items ADD CONSTRAINT unique_roll_dispatch UNIQUE (rollId);

-- Invoice-dispatch quantity matching
ALTER TABLE invoices ADD CONSTRAINT invoice_matches_dispatch_quantity
  CHECK (totalQuantity = (SELECT SUM(quantity) FROM dispatch_items WHERE dispatchId = dispatchId));

-- Payment allocation limits
ALTER TABLE payments ADD CONSTRAINT payment_within_invoice_balance
  CHECK (amount <= (SELECT (totalAmount - paidAmount) FROM invoices WHERE id = invoiceId));
```

## 5. ATTENDANCE & WAGE CONSTRAINTS

### Missing Implementations:
- [ ] **One attendance per worker per shift** (Unique constraint)
- [ ] **Manual corrections require reason** (NOT NULL when corrected)
- [ ] **Wage calculation rules** (Check constraints + validation)
- [ ] **Locked wage sheets immutable** (Check constraint)
- [ ] **Money in integer paise** (Data type enforcement)

### Required Schema Changes:
```sql
-- Attendance uniqueness
CREATE UNIQUE INDEX unique_worker_shift_attendance 
ON attendance (workerId, date, shiftId);

-- Wage record constraints
ALTER TABLE wage_records ADD CONSTRAINT wage_calculation_valid
  CHECK (netPay = (basicWage + overtime - deductions));
ALTER TABLE wage_records ADD CONSTRAINT locked_wage_immutable
  CHECK ((isLocked = false) OR (updatedAt = createdAt));

-- Money in paise
ALTER TABLE orders ALTER COLUMN ratePerMetre TYPE INT; -- Convert to paise
ALTER TABLE invoices ALTER COLUMN totalAmount TYPE INT;
ALTER TABLE payments ALTER COLUMN amount TYPE INT;
```

## 6. STATUS LIFECYCLE ENFORCEMENT

### Status Transitions to Implement:
```
Order: DRAFT → CONFIRMED → YARN_PENDING → IN_PRODUCTION → QUALITY_CHECK → READY_TO_SHIP → DISPATCHED → CLOSED
Machine: IDLE → RUNNING → BREAKDOWN → IDLE
Roll: PRODUCED → AWAITING_QC → PASSED/REWORK/REJECTED → FINISHED_STOCK → DISPATCHED
PO: RAISED → PARTIALLY_RECEIVED → RECEIVED
```

### Implementation Strategy:
1. **Database CHECK constraints** for valid status values
2. **Prisma middleware** for transition validation
3. **Service layer validation** with statusLifecycles.js utility
4. **Database triggers** for complex state management

## 7. AUDIT TRAIL REQUIREMENTS

### Missing Audit Triggers:
- [ ] **Stock adjustments** → audit_logs
- [ ] **Order status changes** → order_status_history 
- [ ] **Quality inspection overrides** → audit_logs
- [ ] **Dispatch confirmations** → audit_logs
- [ ] **Wage corrections** → audit_logs
- [ ] **Invoice modifications** → audit_logs

## 8. COMPUTED/DERIVED FIELDS

### Business Logic Calculations:
- [ ] **Available Stock** = currentStock - reservedQuantity
- [ ] **Order Progress** = completed rolls / total quantity
- [ ] **Machine Efficiency** = actual output / planned output
- [ ] **Cost per Roll** = total order cost / good rolls produced
- [ ] **Outstanding Balance** = invoice total - payments

## IMPLEMENTATION PRIORITY:

1. **Critical Data Integrity** (Unique constraints, NOT NULL, Check constraints)
2. **Status Lifecycle Enforcement** (State machine validation)
3. **Business Logic Validation** (Complex check constraints)
4. **Audit Triggers** (History tracking)
5. **Computed Fields** (Derived values)

## TESTING STRATEGY:

Each constraint will be tested with:
1. **Valid data insertion** (should succeed)
2. **Invalid data insertion** (should fail with specific error)
3. **Edge cases** (boundary conditions)
4. **Business scenario testing** (end-to-end workflows)