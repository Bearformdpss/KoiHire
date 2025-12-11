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

async function baselineMigrations() {
  console.log('🔍 Checking migration baseline status...');

  try {
    // Check if any migrations exist in the table
    const existingMigrations = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "_prisma_migrations"
    `;

    const count = Number(existingMigrations[0].count);

    if (count > 0) {
      console.log(`✅ Migrations already baselined (${count} records found). Skipping.`);
      return;
    }

    console.log('📝 No migrations found. Baselining all migrations...');

    // Insert all migrations as applied
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

baselineMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Baseline failed:', error);
    process.exit(1);
  });
