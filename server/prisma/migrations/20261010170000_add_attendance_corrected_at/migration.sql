-- Add timestamp audit field for manual attendance corrections.
ALTER TABLE "attendance" ADD COLUMN "correctedAt" TIMESTAMP(3);
