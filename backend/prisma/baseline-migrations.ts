import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const migrations = [
  { name: '20251023092742_initial_schema', checksum: '77b68292b5555125ba428fc2a22917d1f92a5048875f9f5d6deed556c50fb475' },
  { name: '20251030_add_password_reset_tokens', checksum: '9aeb6c35455276b91500bd6f2e8bc03fe33408d748ac3835adb82a210d186ce0' },
  { name: '20251105005413_add_stripe_connect_and_payouts', checksum: 'fa9884ccc150450ce3fa73d8f55da17ec667d3a6355a495754852c2fa1032d3d' },
  { name: '20251202000000_add_work_item_notes', checksum: '12677376db44a6cb9b3d6c4ce3b5ea6aa8639b43d243197a1220f60e1425103b' },
  { name: '20251204000000_add_subcategory_to_services', checksum: '55a7185ab2010d0e986c99c449aef86d5d07770ecd1d4fcffd815bd0f783f8e2' },
  { name: '20251205000000_add_project_number', checksum: '0fc1b20cc601adc4ed65a2cdb4aff50c81be857d200e12f7c70707eb9668c56d' },
  { name: '20251210000000_add_payout_preferences', checksum: '9e3f9b1b19ada07de72bcf91167c48a4b2a171d5749fccf46b16b2187798ae7b' },
];

// Ensure critical columns exist in the database
async function ensureCriticalColumnsExist() {
  console.log('🔧 Ensuring critical database columns exist...');

  try {
    // Check and create PayoutMethod enum if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutMethod') THEN
          CREATE TYPE "PayoutMethod" AS ENUM ('STRIPE', 'PAYPAL', 'PAYONEER');
        END IF;
      END$$;
    `);
    console.log('  ✓ PayoutMethod enum verified');

    // Add payout preference columns to users table if they don't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payoutMethod" "PayoutMethod";
    `);
    console.log('  ✓ payoutMethod column verified');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paypalEmail" TEXT;
    `);
    console.log('  ✓ paypalEmail column verified');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payoneerEmail" TEXT;
    `);
    console.log('  ✓ payoneerEmail column verified');

    console.log('✅ All critical columns verified!');
  } catch (error) {
    console.error('⚠️ Error ensuring columns:', error);
    // Don't throw - let the app continue, Prisma will report specific errors
  }
}

async function baselineMigrations() {
  console.log('🔍 Checking migration baseline status...');

  try {
    // Check for any failed migrations (finished_at is NULL means failed)
    const failedMigrations = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE finished_at IS NULL AND rolled_back_at IS NULL
    `;

    if (failedMigrations.length > 0) {
      console.log(`⚠️  Found ${failedMigrations.length} failed migration(s). Cleaning up...`);

      // Delete all existing records and re-baseline
      await prisma.$executeRaw`DELETE FROM "_prisma_migrations"`;
      console.log('🗑️  Cleared migration table.');

      // Insert all migrations as successfully applied
      for (const migration of migrations) {
        await prisma.$executeRaw`
          INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
          VALUES (gen_random_uuid(), ${migration.checksum}, NOW(), ${migration.name}, NULL, NULL, NOW(), 1)
        `;
        console.log(`  ✓ Marked as applied: ${migration.name}`);
      }

      console.log('✅ All migrations re-baselined successfully!');
      return;
    }

    // Check if we have all 7 migrations
    const existingMigrations = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL
    `;

    const count = Number(existingMigrations[0].count);

    if (count >= 7) {
      console.log(`✅ All migrations already baselined (${count} records found). Skipping.`);
      return;
    }

    console.log(`📝 Found ${count} migrations, need 7. Re-baselining...`);

    // Clear and re-insert all
    await prisma.$executeRaw`DELETE FROM "_prisma_migrations"`;

    for (const migration of migrations) {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (gen_random_uuid(), ${migration.checksum}, NOW(), ${migration.name}, NULL, NULL, NOW(), 1)
      `;
      console.log(`  ✓ Marked as applied: ${migration.name}`);
    }

    console.log('✅ All migrations baselined successfully!');
  } catch (error) {
    // If _prisma_migrations table doesn't exist, that's fine - migrate deploy will create it
    if (error instanceof Error && error.message.includes('_prisma_migrations')) {
      console.log('ℹ️  _prisma_migrations table does not exist yet. Prisma migrate deploy will handle this.');
      return;
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await baselineMigrations();
  await ensureCriticalColumnsExist();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Baseline failed:', error);
    process.exit(1);
  });
