import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEscrowData() {
  console.log('🔍 Checking escrow and transaction data for mike.dev...');

  try {
    const mikeUser = await prisma.user.findUnique({
      where: { email: 'mike.dev@example.com' },
      select: { id: true, username: true, totalEarnings: true }
    });

    if (!mikeUser) {
      console.error('❌ mike.dev user not found');
      return;
    }

    // Check escrow records
    const escrows = await prisma.escrow.findMany({
      where: {
        project: {
          freelancerId: mikeUser.id
        }
      },
      include: {
        project: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    console.log(`\n💰 Escrow records for ${mikeUser.username}:`);
    escrows.forEach(escrow => {
      console.log(`  - ${escrow.project.title}: $${escrow.amount} (${escrow.status}) - Project: ${escrow.project.status}`);
    });

    // Check transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: mikeUser.id },
      include: {
        escrow: {
          include: {
            project: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n💸 Transaction records for ${mikeUser.username}:`);
    transactions.forEach(tx => {
      console.log(`  - ${tx.type}: $${tx.amount} (${tx.status}) - ${tx.description}`);
    });

    console.log(`\n📊 Current totalEarnings: $${mikeUser.totalEarnings}`);
    
    // Calculate expected earnings based on transactions
    const earnings = transactions
      .filter(tx => tx.type === 'WITHDRAWAL' && tx.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log(`🧮 Expected earnings from completed transactions: $${earnings}`);

  } catch (error) {
    console.error('❌ Error checking escrow data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEscrowData();