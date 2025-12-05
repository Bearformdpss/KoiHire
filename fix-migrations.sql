-- Fix failed Prisma migration and prepare database for new migrations
-- This script resolves the migration conflict caused by manual database changes

-- Step 1: Check current migration status (for reference)
-- SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;

-- Step 2: Mark the failed migration as completed
-- The migration failed because columns already exist (from manual changes)
-- Since the columns exist, we can safely mark it as applied
UPDATE "_prisma_migrations"
SET finished_at = started_at,
    applied_steps_count = 1,
    logs = 'Manually marked as applied - columns already exist from manual database changes'
WHERE migration_name = '20251105005413_add_stripe_connect_and_payouts'
  AND finished_at IS NULL;

-- Step 3: Verify the fix worked (optional - comment out if not needed)
-- SELECT migration_name, finished_at, applied_steps_count
-- FROM "_prisma_migrations"
-- WHERE migration_name = '20251105005413_add_stripe_connect_and_payouts';

-- After running this script:
-- 1. The failed migration will be marked as successfully applied
-- 2. Prisma will be able to apply new migrations (including the subcategory one)
-- 3. Redeploy your Railway service to trigger the migration process
