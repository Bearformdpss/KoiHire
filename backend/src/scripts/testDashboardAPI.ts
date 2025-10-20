import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDashboardStats() {
  console.log('🧪 Testing dashboard stats for mike.dev...');

  try {
    const mikeUser = await prisma.user.findUnique({
      where: { email: 'mike.dev@example.com' },
      select: {
        id: true,
        username: true,
        role: true,
        totalEarnings: true,
        rating: true
      }
    });

    if (!mikeUser) {
      console.error('❌ mike.dev user not found');
      return;
    }

    console.log(`👤 User: ${mikeUser.username} (${mikeUser.role})`);
    console.log(`💰 Current totalEarnings: $${mikeUser.totalEarnings}`);
    console.log(`⭐ Rating: ${mikeUser.rating}`);

    if (mikeUser.role === 'FREELANCER') {
      // Freelancer dashboard stats (same logic as API)
      const [
        activeProjects,
        completedProjects,
        totalApplications,
        acceptedApplications
      ] = await Promise.all([
        prisma.project.count({
          where: {
            freelancerId: mikeUser.id,
            status: 'IN_PROGRESS'
          }
        }),
        prisma.project.count({
          where: {
            freelancerId: mikeUser.id,
            status: 'COMPLETED'
          }
        }),
        prisma.application.count({
          where: {
            freelancerId: mikeUser.id
          }
        }),
        prisma.application.count({
          where: {
            freelancerId: mikeUser.id,
            status: 'ACCEPTED'
          }
        })
      ]);

      console.log('\n📊 Dashboard Stats:');
      console.log(`  Active Projects: ${activeProjects}`);
      console.log(`  Total Earned: $${mikeUser.totalEarnings}`);
      console.log(`  Rating: ${mikeUser.rating?.toFixed(1) || 'N/A'}`);
      console.log(`  Completed Projects: ${completedProjects}`);
      
      console.log('\n📈 Additional Stats:');
      console.log(`  Total Applications: ${totalApplications}`);
      console.log(`  Accepted Applications: ${acceptedApplications}`);
    }

  } catch (error) {
    console.error('❌ Error testing dashboard stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardStats();