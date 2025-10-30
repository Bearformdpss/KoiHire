const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  try {
    const categories = [
      { name: 'Web Development', description: 'Frontend, backend, and full-stack web development', slug: 'web-development', icon: '💻' },
      { name: 'Mobile Development', description: 'iOS, Android, and cross-platform mobile apps', slug: 'mobile-development', icon: '📱' },
      { name: 'Design & Creative', description: 'UI/UX design, graphic design, and creative services', slug: 'design-creative', icon: '🎨' },
      { name: 'Writing & Translation', description: 'Content writing, copywriting, and translation services', slug: 'writing-translation', icon: '✍️' },
      { name: 'Marketing & SEO', description: 'Digital marketing, SEO, and social media management', slug: 'marketing-seo', icon: '📈' },
      { name: 'Data & Analytics', description: 'Data analysis, machine learning, and business intelligence', slug: 'data-analytics', icon: '📊' }
    ];

    for (const cat of categories) {
      await prisma.category.create({ data: cat });
      console.log(`✅ Created: ${cat.name}`);
    }

    console.log('🎉 All categories seeded successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories();
