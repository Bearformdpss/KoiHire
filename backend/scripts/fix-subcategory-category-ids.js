const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSubcategoryCategoryIds() {
  console.log('Fixing subcategory categoryId mismatches...\n');

  // Mapping of OLD (wrong) categoryIds to NEW (correct) categoryIds from categories table
  const idMappings = [
    {
      old: 'cmh51loxb0000hfguqus2x1ij',  // Old Web Development ID in subcategories
      new: 'cmh511oxb0000hfguqus2x1li',  // Current Web Development ID in categories
      name: 'Web Development'
    },
    {
      old: 'cmh51lp3k0001hfgutwi45q40',  // Old Mobile Development ID
      new: 'cmh511p3k0001hfgutwi45q40',  // Current Mobile Development ID
      name: 'Mobile Development'
    },
    {
      old: 'cmh51lp6h0002hfgujdkwdast',  // Old Design & Creative ID
      new: 'cmh511p6h0002hfgujdkwdast',  // Current Design & Creative ID
      name: 'Design & Creative'
    },
    {
      old: 'cmh51lp9d0003hfgunkqkdgsw',  // Old Writing & Translation ID
      new: 'cmh511p9d0003hfgunkqkdgsw',  // Current Writing & Translation ID
      name: 'Writing & Translation'
    },
    {
      old: 'cmh51lpc90004hfgu9ehf9gsz',  // Old Marketing & SEO ID
      new: 'cmh511pc90004hfgu9ehf9gsz',  // Current Marketing & SEO ID
      name: 'Marketing & SEO'
    },
    {
      old: 'cmh51lpf50005hfguiafak18t',  // Old Data & Analytics ID
      new: 'cmh511pf50005hfguiafak18t',  // Current Data & Analytics ID
      name: 'Data & Analytics'
    }
  ];

  for (const mapping of idMappings) {
    console.log(`\nUpdating ${mapping.name}:`);
    console.log(`  From: ${mapping.old}`);
    console.log(`  To:   ${mapping.new}`);

    try {
      const result = await prisma.subcategory.updateMany({
        where: { categoryId: mapping.old },
        data: { categoryId: mapping.new }
      });

      console.log(`  ✅ Updated ${result.count} subcategories`);
    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
    }
  }

  console.log('\n✅ Done! Verifying counts by category...\n');

  // Verify the fix
  const categories = await prisma.$queryRaw`
    SELECT c.name, c.id, COUNT(s.id)::int as subcat_count
    FROM categories c
    LEFT JOIN "Subcategory" s ON s.categoryid = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name
  `;

  console.log('Category subcounts:');
  categories.forEach(cat => {
    console.log(`  ${cat.name}: ${cat.subcat_count} subcategories`);
  });
}

fixSubcategoryCategoryIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
