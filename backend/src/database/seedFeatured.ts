import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedFeaturedProjects() {
  try {
    console.log('🌟 Seeding featured projects for testing...');

    // First, let's create some client users if they don't exist
    const clientPassword = await bcrypt.hash('password123', 12);
    
    // Create premium clients
    const premiumClient1 = await prisma.user.upsert({
      where: { email: 'premium.client1@example.com' },
      update: {},
      create: {
        email: 'premium.client1@example.com',
        username: 'premiumclient1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: clientPassword,
        role: 'CLIENT',
        isVerified: true,
        rating: 4.9,
        totalSpent: 15000
      }
    });

    const premiumClient2 = await prisma.user.upsert({
      where: { email: 'premium.client2@example.com' },
      update: {},
      create: {
        email: 'premium.client2@example.com',
        username: 'premiumclient2',
        firstName: 'Marcus',
        lastName: 'Chen',
        password: clientPassword,
        role: 'CLIENT',
        isVerified: true,
        rating: 4.8,
        totalSpent: 25000
      }
    });

    const spotlightClient1 = await prisma.user.upsert({
      where: { email: 'spotlight.client1@example.com' },
      update: {},
      create: {
        email: 'spotlight.client1@example.com',
        username: 'spotlightclient1',
        firstName: 'Alexandra',
        lastName: 'Rodriguez',
        password: clientPassword,
        role: 'CLIENT',
        isVerified: true,
        rating: 5.0,
        totalSpent: 50000
      }
    });

    const spotlightClient2 = await prisma.user.upsert({
      where: { email: 'spotlight.client2@example.com' },
      update: {},
      create: {
        email: 'spotlight.client2@example.com',
        username: 'spotlightclient2',
        firstName: 'David',
        lastName: 'Thompson',
        password: clientPassword,
        role: 'CLIENT',
        isVerified: true,
        rating: 4.9,
        totalSpent: 75000
      }
    });

    // Get or create categories
    const webDevCategory = await prisma.category.upsert({
      where: { slug: 'web-development' },
      update: {},
      create: {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend and backend web development projects'
      }
    });

    const mobileCategory = await prisma.category.upsert({
      where: { slug: 'mobile-development' },
      update: {},
      create: {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'iOS and Android app development'
      }
    });

    const designCategory = await prisma.category.upsert({
      where: { slug: 'design' },
      update: {},
      create: {
        name: 'Design',
        slug: 'design',
        description: 'UI/UX design and visual design projects'
      }
    });

    const dataCategory = await prisma.category.upsert({
      where: { slug: 'data-science' },
      update: {},
      create: {
        name: 'Data Science',
        slug: 'data-science',
        description: 'Data analysis and machine learning projects'
      }
    });

    // Get or create skills
    const skills = await Promise.all([
      prisma.skill.upsert({
        where: { name: 'React' },
        update: {},
        create: { name: 'React', categoryId: webDevCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'Node.js' },
        update: {},
        create: { name: 'Node.js', categoryId: webDevCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'TypeScript' },
        update: {},
        create: { name: 'TypeScript', categoryId: webDevCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'React Native' },
        update: {},
        create: { name: 'React Native', categoryId: mobileCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'iOS' },
        update: {},
        create: { name: 'iOS', categoryId: mobileCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'Swift' },
        update: {},
        create: { name: 'Swift', categoryId: mobileCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'UI/UX Design' },
        update: {},
        create: { name: 'UI/UX Design', categoryId: designCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'Figma' },
        update: {},
        create: { name: 'Figma', categoryId: designCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'Python' },
        update: {},
        create: { name: 'Python', categoryId: dataCategory.id }
      }),
      prisma.skill.upsert({
        where: { name: 'Machine Learning' },
        update: {},
        create: { name: 'Machine Learning', categoryId: dataCategory.id }
      })
    ]);

    // Create SPOTLIGHT projects (Hero Banner)
    const spotlightProject1 = await prisma.project.create({
      data: {
        title: 'Enterprise AI-Powered E-commerce Platform',
        description: 'Build a next-generation e-commerce platform with AI-driven product recommendations, real-time inventory management, and advanced analytics dashboard. This is a high-stakes project for a Fortune 500 company looking to revolutionize their online presence.',
        requirements: 'Must have 5+ years experience with enterprise-scale applications, AI/ML integration, and high-traffic systems.',
        minBudget: 25000,
        maxBudget: 50000,
        timeline: '6 months',
        status: 'OPEN',
        categoryId: webDevCategory.id,
        clientId: spotlightClient1.id,
        isFeatured: true,
        featuredLevel: 'SPOTLIGHT',
        featuredPrice: 499,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    });

    const spotlightProject2 = await prisma.project.create({
      data: {
        title: 'Revolutionary FinTech Mobile App with Blockchain Integration',
        description: 'Develop a cutting-edge mobile application for cryptocurrency trading, DeFi protocols, and digital wallet management. The app will serve over 1 million users and handle billions in transactions. Security and scalability are paramount.',
        requirements: 'Blockchain expertise required, experience with financial applications, security auditing knowledge essential.',
        minBudget: 40000,
        maxBudget: 80000,
        timeline: '8 months',
        status: 'OPEN',
        categoryId: mobileCategory.id,
        clientId: spotlightClient2.id,
        isFeatured: true,
        featuredLevel: 'SPOTLIGHT',
        featuredPrice: 599,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    });

    const spotlightProject3 = await prisma.project.create({
      data: {
        title: 'NASA Mars Mission Data Visualization Platform',
        description: 'Create an advanced data visualization and analysis platform for NASA\'s Mars exploration mission. Process and visualize terabytes of satellite data, geological surveys, and atmospheric readings in real-time.',
        requirements: 'PhD in Computer Science or related field preferred, experience with big data processing, scientific visualization.',
        minBudget: 60000,
        maxBudget: 120000,
        timeline: '12 months',
        status: 'OPEN',
        categoryId: dataCategory.id,
        clientId: spotlightClient1.id,
        isFeatured: true,
        featuredLevel: 'SPOTLIGHT',
        featuredPrice: 799,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    });

    // Create PREMIUM projects (Featured Section)
    const premiumProject1 = await prisma.project.create({
      data: {
        title: 'Modern SaaS Dashboard with Advanced Analytics',
        description: 'Design and develop a comprehensive SaaS dashboard for project management with real-time collaboration, advanced reporting, and integrations with popular tools like Slack, GitHub, and Figma.',
        requirements: 'Strong React/Next.js skills, experience with real-time features, API integrations.',
        minBudget: 8000,
        maxBudget: 15000,
        timeline: '3 months',
        status: 'OPEN',
        categoryId: webDevCategory.id,
        clientId: premiumClient1.id,
        isFeatured: true,
        featuredLevel: 'PREMIUM',
        featuredPrice: 199,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      }
    });

    const premiumProject2 = await prisma.project.create({
      data: {
        title: 'Luxury Brand E-commerce Mobile App',
        description: 'Build a premium mobile shopping experience for a luxury fashion brand. Includes AR try-on features, personalized recommendations, exclusive member areas, and seamless checkout with multiple payment options.',
        requirements: 'Mobile development expertise, experience with AR/VR, luxury brand aesthetic sensibility.',
        minBudget: 12000,
        maxBudget: 25000,
        timeline: '4 months',
        status: 'OPEN',
        categoryId: mobileCategory.id,
        clientId: premiumClient2.id,
        isFeatured: true,
        featuredLevel: 'PREMIUM',
        featuredPrice: 249,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    });

    const premiumProject3 = await prisma.project.create({
      data: {
        title: 'Healthcare Platform UI/UX Complete Redesign',
        description: 'Complete redesign of a healthcare management platform used by 50+ hospitals. Focus on improving user experience for doctors, nurses, and administrators while ensuring HIPAA compliance and accessibility standards.',
        requirements: 'Healthcare industry experience, HIPAA knowledge, accessibility compliance expertise.',
        minBudget: 6000,
        maxBudget: 12000,
        timeline: '2.5 months',
        status: 'OPEN',
        categoryId: designCategory.id,
        clientId: premiumClient1.id,
        isFeatured: true,
        featuredLevel: 'PREMIUM',
        featuredPrice: 149,
        featuredAt: new Date(),
        featuredUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      }
    });

    // Add skills to projects
    const projectSkills = [
      // Spotlight Project 1 skills
      { projectId: spotlightProject1.id, skillId: skills.find(s => s.name === 'React')!.id },
      { projectId: spotlightProject1.id, skillId: skills.find(s => s.name === 'Node.js')!.id },
      { projectId: spotlightProject1.id, skillId: skills.find(s => s.name === 'TypeScript')!.id },
      { projectId: spotlightProject1.id, skillId: skills.find(s => s.name === 'Machine Learning')!.id },

      // Spotlight Project 2 skills
      { projectId: spotlightProject2.id, skillId: skills.find(s => s.name === 'React Native')!.id },
      { projectId: spotlightProject2.id, skillId: skills.find(s => s.name === 'iOS')!.id },
      { projectId: spotlightProject2.id, skillId: skills.find(s => s.name === 'Swift')!.id },
      { projectId: spotlightProject2.id, skillId: skills.find(s => s.name === 'TypeScript')!.id },

      // Spotlight Project 3 skills
      { projectId: spotlightProject3.id, skillId: skills.find(s => s.name === 'Python')!.id },
      { projectId: spotlightProject3.id, skillId: skills.find(s => s.name === 'Machine Learning')!.id },
      { projectId: spotlightProject3.id, skillId: skills.find(s => s.name === 'React')!.id },

      // Premium Project 1 skills
      { projectId: premiumProject1.id, skillId: skills.find(s => s.name === 'React')!.id },
      { projectId: premiumProject1.id, skillId: skills.find(s => s.name === 'Node.js')!.id },
      { projectId: premiumProject1.id, skillId: skills.find(s => s.name === 'TypeScript')!.id },

      // Premium Project 2 skills
      { projectId: premiumProject2.id, skillId: skills.find(s => s.name === 'React Native')!.id },
      { projectId: premiumProject2.id, skillId: skills.find(s => s.name === 'iOS')!.id },
      { projectId: premiumProject2.id, skillId: skills.find(s => s.name === 'Swift')!.id },

      // Premium Project 3 skills
      { projectId: premiumProject3.id, skillId: skills.find(s => s.name === 'UI/UX Design')!.id },
      { projectId: premiumProject3.id, skillId: skills.find(s => s.name === 'Figma')!.id },
    ];

    await Promise.all(
      projectSkills.map(ps => 
        prisma.projectSkill.create({ data: ps })
      )
    );

    console.log('✅ Featured projects seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   🌟 ${3} SPOTLIGHT projects (Hero Banner)`);
    console.log(`   💎 ${3} PREMIUM projects (Featured Section)`);
    console.log(`   👥 ${4} Premium clients`);
    console.log(`   🎯 ${4} Categories with ${10} skills`);
    console.log('');
    console.log('🎨 You can now see the SPOTLIGHT carousel and PREMIUM section in action!');
    console.log('🔄 SPOTLIGHT projects rotate every 10 seconds');
    console.log('💫 PREMIUM section shows 2 projects at a time');

  } catch (error) {
    console.error('❌ Error seeding featured projects:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedFeaturedProjects()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });