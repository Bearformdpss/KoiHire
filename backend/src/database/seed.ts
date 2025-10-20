import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.userSkill.deleteMany();
  await prisma.projectSkill.deleteMany();
  await prisma.application.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.escrow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Web Development',
        description: 'Frontend, backend, and full-stack web development',
        slug: 'web-development',
        icon: '💻'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Mobile Development',
        description: 'iOS, Android, and cross-platform mobile apps',
        slug: 'mobile-development',
        icon: '📱'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Design & Creative',
        description: 'UI/UX design, graphic design, and creative services',
        slug: 'design-creative',
        icon: '🎨'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Writing & Translation',
        description: 'Content writing, copywriting, and translation services',
        slug: 'writing-translation',
        icon: '✍️'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Marketing & SEO',
        description: 'Digital marketing, SEO, and social media management',
        slug: 'marketing-seo',
        icon: '📈'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Data & Analytics',
        description: 'Data analysis, machine learning, and business intelligence',
        slug: 'data-analytics',
        icon: '📊'
      }
    })
  ]);

  console.log('✅ Created categories');

  // Create skills
  const webSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'React',
        description: 'JavaScript library for building user interfaces',
        categoryId: categories[0].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Node.js',
        description: 'JavaScript runtime for server-side development',
        categoryId: categories[0].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'TypeScript',
        description: 'Typed superset of JavaScript',
        categoryId: categories[0].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Next.js',
        description: 'React framework for production',
        categoryId: categories[0].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Python',
        description: 'High-level programming language',
        categoryId: categories[0].id
      }
    })
  ]);

  const mobileSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'React Native',
        description: 'Cross-platform mobile development',
        categoryId: categories[1].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Flutter',
        description: 'Google\'s UI toolkit for mobile apps',
        categoryId: categories[1].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Swift',
        description: 'Programming language for iOS development',
        categoryId: categories[1].id
      }
    })
  ]);

  const designSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'UI/UX Design',
        description: 'User interface and experience design',
        categoryId: categories[2].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Figma',
        description: 'Collaborative design tool',
        categoryId: categories[2].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Adobe Creative Suite',
        description: 'Collection of creative software applications',
        categoryId: categories[2].id
      }
    })
  ]);

  const writingSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'Content Writing',
        description: 'Creating engaging written content',
        categoryId: categories[3].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Copywriting',
        description: 'Writing persuasive marketing copy',
        categoryId: categories[3].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'SEO Writing',
        description: 'Search engine optimized content',
        categoryId: categories[3].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Technical Writing',
        description: 'Documentation and technical content',
        categoryId: categories[3].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Translation',
        description: 'Language translation services',
        categoryId: categories[3].id
      }
    })
  ]);

  const marketingSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'SEO',
        description: 'Search engine optimization',
        categoryId: categories[4].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Social Media Marketing',
        description: 'Social media strategy and management',
        categoryId: categories[4].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Google Ads',
        description: 'Pay-per-click advertising',
        categoryId: categories[4].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Email Marketing',
        description: 'Email campaign management',
        categoryId: categories[4].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Content Marketing',
        description: 'Content strategy and distribution',
        categoryId: categories[4].id
      }
    })
  ]);

  const dataSkills = await Promise.all([
    prisma.skill.create({
      data: {
        name: 'Data Analysis',
        description: 'Statistical analysis and insights',
        categoryId: categories[5].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Machine Learning',
        description: 'ML model development',
        categoryId: categories[5].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'SQL',
        description: 'Database querying and management',
        categoryId: categories[5].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'Data Visualization',
        description: 'Charts, graphs, and dashboards',
        categoryId: categories[5].id
      }
    }),
    prisma.skill.create({
      data: {
        name: 'R Programming',
        description: 'Statistical programming language',
        categoryId: categories[5].id
      }
    })
  ]);

  console.log('✅ Created skills');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    // Clients
    prisma.user.create({
      data: {
        email: 'john.client@example.com',
        username: 'johnclient',
        firstName: 'John',
        lastName: 'Doe',
        password: hashedPassword,
        role: 'CLIENT',
        bio: 'Tech startup founder looking for talented developers',
        location: 'San Francisco, CA',
        isVerified: true,
        totalSpent: 5000
      }
    }),
    prisma.user.create({
      data: {
        email: 'sarah.client@example.com',
        username: 'sarahclient',
        firstName: 'Sarah',
        lastName: 'Johnson',
        password: hashedPassword,
        role: 'CLIENT',
        bio: 'Marketing agency owner seeking creative professionals',
        location: 'New York, NY',
        isVerified: true,
        totalSpent: 3200
      }
    }),
    
    // Freelancers
    prisma.user.create({
      data: {
        email: 'mike.dev@example.com',
        username: 'mikedev',
        firstName: 'Mike',
        lastName: 'Chen',
        password: hashedPassword,
        role: 'FREELANCER',
        bio: 'Full-stack developer with 5+ years experience in React and Node.js',
        location: 'Austin, TX',
        isVerified: true,
        rating: 4.8,
        totalEarnings: 12000
      }
    }),
    prisma.user.create({
      data: {
        email: 'anna.designer@example.com',
        username: 'annadesigns',
        firstName: 'Anna',
        lastName: 'Smith',
        password: hashedPassword,
        role: 'FREELANCER',
        bio: 'UI/UX designer passionate about creating beautiful and functional user experiences',
        location: 'Los Angeles, CA',
        isVerified: true,
        rating: 4.9,
        totalEarnings: 8500
      }
    }),
    prisma.user.create({
      data: {
        email: 'david.mobile@example.com',
        username: 'davidmobile',
        firstName: 'David',
        lastName: 'Wilson',
        password: hashedPassword,
        role: 'FREELANCER',
        bio: 'Mobile app developer specializing in React Native and Flutter',
        location: 'Seattle, WA',
        isVerified: true,
        rating: 4.7,
        totalEarnings: 15000
      }
    })
  ]);

  console.log('✅ Created users');

  // Add skills to freelancers
  await prisma.userSkill.createMany({
    data: [
      // Mike's skills
      { userId: users[2].id, skillId: webSkills[0].id, level: 'EXPERT', yearsExp: 5 },
      { userId: users[2].id, skillId: webSkills[1].id, level: 'EXPERT', yearsExp: 4 },
      { userId: users[2].id, skillId: webSkills[2].id, level: 'ADVANCED', yearsExp: 3 },
      { userId: users[2].id, skillId: webSkills[3].id, level: 'ADVANCED', yearsExp: 2 },
      
      // Anna's skills
      { userId: users[3].id, skillId: designSkills[0].id, level: 'EXPERT', yearsExp: 6 },
      { userId: users[3].id, skillId: designSkills[1].id, level: 'EXPERT', yearsExp: 4 },
      { userId: users[3].id, skillId: designSkills[2].id, level: 'ADVANCED', yearsExp: 5 },
      
      // David's skills
      { userId: users[4].id, skillId: mobileSkills[0].id, level: 'EXPERT', yearsExp: 4 },
      { userId: users[4].id, skillId: mobileSkills[1].id, level: 'ADVANCED', yearsExp: 3 },
      { userId: users[4].id, skillId: mobileSkills[2].id, level: 'INTERMEDIATE', yearsExp: 2 }
    ]
  });

  console.log('✅ Added user skills');

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: 'E-commerce Website Development',
        description: 'Need a full-stack developer to build a modern e-commerce website with React, Node.js, and Stripe integration. The site should have user authentication, product catalog, shopping cart, and payment processing.',
        requirements: 'Experience with React, Node.js, MongoDB, Stripe payments, responsive design',
        minBudget: 3000,
        maxBudget: 5000,
        timeline: '6-8 weeks',
        status: 'OPEN',
        categoryId: categories[0].id,
        clientId: users[0].id,
        skills: {
          create: [
            { skillId: webSkills[0].id },
            { skillId: webSkills[1].id },
            { skillId: webSkills[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        title: 'Mobile App UI/UX Design',
        description: 'Looking for a talented UI/UX designer to create mockups and prototypes for a fitness tracking mobile app. Need modern, clean design with good user experience.',
        requirements: 'Experience with Figma, mobile design patterns, user research',
        minBudget: 1500,
        maxBudget: 2500,
        timeline: '3-4 weeks',
        status: 'OPEN',
        categoryId: categories[2].id,
        clientId: users[1].id,
        skills: {
          create: [
            { skillId: designSkills[0].id },
            { skillId: designSkills[1].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        title: 'React Native Food Delivery App',
        description: 'Build a cross-platform food delivery app similar to UberEats. Features needed: user registration, restaurant listings, menu browsing, order placement, real-time tracking.',
        requirements: 'React Native experience, API integration, real-time features, payment integration',
        minBudget: 4000,
        maxBudget: 7000,
        timeline: '8-10 weeks',
        status: 'IN_PROGRESS',
        categoryId: categories[1].id,
        clientId: users[0].id,
        freelancerId: users[4].id,
        skills: {
          create: [
            { skillId: mobileSkills[0].id }
          ]
        }
      }
    })
  ]);

  console.log('✅ Created projects');

  // Create applications
  await Promise.all([
    prisma.application.create({
      data: {
        projectId: projects[0].id,
        freelancerId: users[2].id,
        coverLetter: 'Hi! I\'m excited about your e-commerce project. With 5+ years of experience in React and Node.js, I\'ve built several similar platforms. I can deliver a scalable, secure solution with all the features you need.',
        proposedBudget: 4200,
        timeline: '7 weeks',
        status: 'PENDING'
      }
    }),
    prisma.application.create({
      data: {
        projectId: projects[1].id,
        freelancerId: users[3].id,
        coverLetter: 'Hello! I\'d love to work on your fitness app design. I have extensive experience in mobile UI/UX design and have created designs for several health and fitness apps. I can provide modern, user-friendly designs.',
        proposedBudget: 2000,
        timeline: '3 weeks',
        status: 'ACCEPTED'
      }
    })
  ]);

  console.log('✅ Created applications');

  // Create a conversation for the in-progress project
  const conversation = await prisma.conversation.create({
    data: {
      projectId: projects[2].id,
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[4].id }
        ]
      }
    }
  });

  // Create some messages
  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[0].id,
        content: 'Hi David, excited to work with you on the food delivery app!',
        type: 'TEXT'
      }
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: users[4].id,
        content: 'Thank you John! I\'m looking forward to building this app. I\'ll start with the user authentication and onboarding flow.',
        type: 'TEXT'
      }
    })
  ]);

  console.log('✅ Created conversation and messages');

  // Create escrow for in-progress project
  await prisma.escrow.create({
    data: {
      projectId: projects[2].id,
      amount: 5500,
      status: 'FUNDED',
      stripePaymentId: 'pi_mock_payment_intent_id'
    }
  });

  // Create some reviews
  await Promise.all([
    prisma.review.create({
      data: {
        projectId: projects[2].id,
        reviewerId: users[0].id,
        revieweeId: users[4].id,
        rating: 5,
        comment: 'David delivered exceptional work on our mobile app. Great communication and technical skills!'
      }
    })
  ]);

  console.log('✅ Created reviews');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });