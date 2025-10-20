import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetMikeDevEarnings() {
  console.log('🔄 Resetting mike.dev totalEarnings to reflect real completed projects...');

  try {
    // Find mike.dev user
    const mikeUser = await prisma.user.findUnique({
      where: { email: 'mike.dev@example.com' },
      select: {
        id: true,
        username: true,
        totalEarnings: true
      }
    });

    if (!mikeUser) {
      console.error('❌ mike.dev user not found');
      return;
    }

    console.log(`📊 Current totalEarnings: $${mikeUser.totalEarnings}`);

    // Reset totalEarnings to 0 to allow real calculations
    const updatedUser = await prisma.user.update({
      where: { id: mikeUser.id },
      data: { totalEarnings: 0 }
    });

    console.log(`✅ Reset ${mikeUser.username} totalEarnings from $${mikeUser.totalEarnings} to $${updatedUser.totalEarnings}`);

    // Show current project status for verification
    const projects = await prisma.project.findMany({
      where: { freelancerId: mikeUser.id },
      select: {
        id: true,
        title: true,
        status: true,
        minBudget: true,
        maxBudget: true
      }
    });

    console.log('\n📋 Mike.dev\'s projects:');
    projects.forEach(project => {
      console.log(`  - ${project.title}: ${project.status} ($${project.minBudget}-$${project.maxBudget})`);
    });

    // Show completed projects count
    const completedCount = await prisma.project.count({
      where: {
        freelancerId: mikeUser.id,
        status: 'COMPLETED'
      }
    });

    console.log(`\n✅ Completed projects: ${completedCount}`);
    console.log('💡 totalEarnings will now reflect real earnings from escrow releases');

  } catch (error) {
    console.error('❌ Error resetting earnings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetMikeDevEarnings();