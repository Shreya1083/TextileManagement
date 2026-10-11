-- Align the database with the Prisma schema field names.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_logs' AND column_name = 'output'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_logs' AND column_name = 'outputQuantity'
  ) THEN
    ALTER TABLE "production_logs" RENAME COLUMN "output" TO "outputQuantity";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_logs' AND column_name = 'waste'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_logs' AND column_name = 'wasteQuantity'
  ) THEN
    ALTER TABLE "production_logs" RENAME COLUMN "waste" TO "wasteQuantity";
  END IF;
END $$;
