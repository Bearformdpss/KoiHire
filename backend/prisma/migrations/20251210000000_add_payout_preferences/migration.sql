-- CreateEnum (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutMethod') THEN
        CREATE TYPE "PayoutMethod" AS ENUM ('STRIPE', 'PAYPAL', 'PAYONEER');
    END IF;
END$$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoutMethod" "PayoutMethod";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoneerEmail" TEXT;
