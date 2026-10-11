-- Add stock reservations used by inventory/order reservation workflows.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReservationStatus') THEN
    CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'FULFILLED', 'RELEASED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "stock_reservations" (
  "id" TEXT NOT NULL,
  "stockBatchId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stock_reservations_stockBatchId_idx" ON "stock_reservations"("stockBatchId");
CREATE INDEX IF NOT EXISTS "stock_reservations_referenceType_referenceId_idx" ON "stock_reservations"("referenceType", "referenceId");
CREATE INDEX IF NOT EXISTS "stock_reservations_status_idx" ON "stock_reservations"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_reservations_stockBatchId_fkey'
  ) THEN
    ALTER TABLE "stock_reservations"
    ADD CONSTRAINT "stock_reservations_stockBatchId_fkey"
    FOREIGN KEY ("stockBatchId") REFERENCES "stock_batches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Attach optional user audit relation to stock movements.
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "userId" TEXT;
CREATE INDEX IF NOT EXISTS "stock_movements_userId_idx" ON "stock_movements"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_userId_fkey'
  ) THEN
    ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
