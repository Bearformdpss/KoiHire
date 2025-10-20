const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleServices() {
  try {
    console.log('Creating sample services...')

    // Get categories and skills
    const categories = await prisma.category.findMany({
      include: { skills: true }
    })

    // Get freelancer users
    const freelancers = await prisma.user.findMany({
      where: { role: 'FREELANCER' }
    })

    if (freelancers.length === 0) {
      console.log('No freelancer users found. Creating sample freelancer...')
      const freelancer = await prisma.user.create({
        data: {
          email: 'jane.freelancer@example.com',
          firstName: 'Jane',
          lastName: 'Freelancer',
          password: '$2b$10$XYZ...', // In real app, would hash password
          role: 'FREELANCER',
          isEmailVerified: true
        }
      })
      freelancers.push(freelancer)
    }

    const webDevCategory = categories.find(c => c.slug === 'web-development')
    const designCategory = categories.find(c => c.slug === 'design-creative')

    if (!webDevCategory || !designCategory) {
      console.log('Required categories not found')
      return
    }

    // Sample services data
    const sampleServices = [
      {
        title: 'Professional React Website Development',
        description: `I will create a modern, responsive website using React and Next.js.

What you get:
✅ Modern, responsive design
✅ Fast loading performance
✅ SEO optimized
✅ Mobile-friendly
✅ Clean, maintainable code
✅ Cross-browser compatibility

Perfect for businesses, portfolios, and landing pages. I have 5+ years of experience in web development and have completed 100+ projects.`,
        shortDescription: 'I will create a modern, responsive React website with Next.js',
        categoryId: webDevCategory.id,
        freelancerId: freelancers[0].id,
        basePrice: 299,
        deliveryTime: 7,
        revisions: 3,
        tags: ['react', 'nextjs', 'website', 'responsive', 'modern'],
        skills: webDevCategory.skills.slice(0, 3).map(s => s.id),
        packages: [
          {
            tier: 'BASIC',
            title: 'Basic Website',
            description: 'Single page website with basic functionality',
            price: 299,
            deliveryTime: 7,
            revisions: 2,
            features: [
              'Responsive single page design',
              'Contact form',
              'Basic SEO optimization',
              'Mobile-friendly design'
            ]
          },
          {
            tier: 'STANDARD',
            title: 'Multi-Page Website',
            description: 'Complete website with multiple pages and advanced features',
            price: 599,
            deliveryTime: 14,
            revisions: 3,
            features: [
              'Up to 5 pages',
              'Contact form with validation',
              'Advanced SEO optimization',
              'Content management system',
              'Social media integration'
            ]
          },
          {
            tier: 'PREMIUM',
            title: 'Full-Stack Application',
            description: 'Complete web application with backend integration',
            price: 1199,
            deliveryTime: 21,
            revisions: 5,
            features: [
              'Unlimited pages',
              'Custom backend API',
              'Database integration',
              'User authentication',
              'Admin dashboard',
              'Third-party integrations'
            ]
          }
        ],
        faqs: [
          {
            question: 'What technologies do you use?',
            answer: 'I primarily use React, Next.js, TypeScript, and Tailwind CSS for the frontend. For backend, I use Node.js with Express and PostgreSQL.'
          },
          {
            question: 'Do you provide source code?',
            answer: 'Yes, you will receive the complete source code along with documentation on how to deploy and maintain the website.'
          },
          {
            question: 'Can you help with hosting?',
            answer: 'Absolutely! I can help you deploy your website on platforms like Vercel, Netlify, or AWS. Hosting setup is included in Standard and Premium packages.'
          }
        ],
        requirements: 'Please provide your website content, brand colors, logo, and any design preferences. If you have a preferred hosting platform, please let me know.',
        isFeatured: true,
        isActive: true
      },
      {
        title: 'Modern UI/UX Design for Web & Mobile',
        description: `I will create stunning UI/UX designs that convert visitors into customers.

What you get:
🎨 Modern, clean design
📱 Mobile-first approach
💡 User-centered design
🔍 Research-based solutions
⚡ Fast delivery
♻️ Unlimited revisions (Premium)

I'm a professional designer with 7+ years of experience working with startups and Fortune 500 companies. My designs focus on usability, conversion, and brand consistency.`,
        shortDescription: 'I will create modern UI/UX designs for your web and mobile applications',
        categoryId: designCategory.id,
        freelancerId: freelancers[0].id,
        basePrice: 199,
        deliveryTime: 5,
        revisions: 3,
        tags: ['ui', 'ux', 'design', 'figma', 'mobile', 'web'],
        skills: designCategory.skills.map(s => s.id),
        packages: [
          {
            tier: 'BASIC',
            title: 'Single Page Design',
            description: 'Professional design for one webpage or mobile screen',
            price: 199,
            deliveryTime: 5,
            revisions: 2,
            features: [
              '1 webpage or mobile screen',
              'High-fidelity mockup',
              'Responsive design',
              'Figma source file'
            ]
          },
          {
            tier: 'STANDARD',
            title: 'Complete Website Design',
            description: 'Full website design with multiple pages and components',
            price: 499,
            deliveryTime: 10,
            revisions: 3,
            features: [
              'Up to 5 pages design',
              'Component library',
              'Interactive prototype',
              'Style guide',
              'Figma source files'
            ]
          },
          {
            tier: 'PREMIUM',
            title: 'Full Design System',
            description: 'Complete design system with branding and guidelines',
            price: 899,
            deliveryTime: 15,
            revisions: 5,
            features: [
              'Unlimited pages',
              'Complete design system',
              'Brand guidelines',
              'Icon set',
              'Interactive prototypes',
              'Developer handoff'
            ]
          }
        ],
        faqs: [
          {
            question: 'What design tools do you use?',
            answer: 'I primarily use Figma for UI/UX design, with Adobe Creative Suite for advanced graphics and branding work.'
          },
          {
            question: 'Do you provide developer handoff?',
            answer: 'Yes! All designs come with detailed specifications, assets, and developer-friendly Figma files for easy implementation.'
          }
        ],
        requirements: 'Please provide your brand guidelines (if any), target audience information, and examples of designs you like. The more information you provide, the better I can tailor the design to your needs.',
        isFeatured: true,
        isActive: true
      },
      {
        title: 'SEO Content Writing & Blog Posts',
        description: `I will write engaging, SEO-optimized content that ranks and converts.

What you get:
📝 Well-researched, original content
🎯 SEO-optimized for better rankings
📊 Keyword research included
✅ Plagiarism-free content
📈 Conversion-focused writing
🚀 Fast turnaround

I'm a professional content writer with 6+ years of experience in digital marketing. I've helped businesses increase their organic traffic by 300%+ through strategic content creation.`,
        shortDescription: 'I will write SEO-optimized blog posts and web content that ranks and converts',
        categoryId: categories.find(c => c.slug === 'writing-translation')?.id,
        freelancerId: freelancers[0].id,
        basePrice: 99,
        deliveryTime: 3,
        revisions: 2,
        tags: ['seo', 'content', 'writing', 'blog', 'copywriting'],
        skills: [],
        packages: [
          {
            tier: 'BASIC',
            title: 'Single Blog Post',
            description: 'One SEO-optimized blog post (800-1000 words)',
            price: 99,
            deliveryTime: 3,
            revisions: 2,
            features: [
              '800-1000 words article',
              'SEO optimization',
              'Keyword research',
              '1 revision included'
            ]
          },
          {
            tier: 'STANDARD',
            title: 'Content Package',
            description: 'Multiple articles with content strategy',
            price: 299,
            deliveryTime: 7,
            revisions: 3,
            features: [
              '3 blog posts (800-1000 words each)',
              'Content strategy consultation',
              'Meta descriptions',
              'Internal linking strategy'
            ]
          },
          {
            tier: 'PREMIUM',
            title: 'Complete Content Strategy',
            description: 'Comprehensive content marketing package',
            price: 599,
            deliveryTime: 14,
            revisions: 5,
            features: [
              '6 blog posts (1000+ words each)',
              'Content calendar',
              'Competitor analysis',
              'Social media posts',
              'Email newsletter content'
            ]
          }
        ],
        faqs: [
          {
            question: 'Do you provide keyword research?',
            answer: 'Yes, I include basic keyword research with all packages. Premium package includes comprehensive keyword strategy.'
          },
          {
            question: 'How do you ensure content quality?',
            answer: 'All content is original, plagiarism-checked, and goes through multiple quality reviews before delivery.'
          }
        ],
        requirements: 'Please provide your target keywords, brand voice guidelines, and any specific topics you want covered. Access to your current website would be helpful for consistency.',
        isFeatured: false,
        isActive: true
      }
    ]

    // Create services
    for (const serviceData of sampleServices) {
      const { packages, faqs, skills, ...serviceInfo } = serviceData

      const service = await prisma.service.create({
        data: {
          ...serviceInfo,
          views: Math.floor(Math.random() * 1000) + 100,
          rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
          packages: {
            create: packages.map(pkg => ({
              ...pkg,
              features: pkg.features
            }))
          },
          faqs: {
            create: faqs.map(faq => ({
              question: faq.question,
              answer: faq.answer
            }))
          },
          skills: {
            create: skills.map(skillId => ({
              skillId
            }))
          }
        }
      })

      console.log(`Created service: ${service.title}`)
    }

    console.log('Sample services created successfully!')

  } catch (error) {
    console.error('Error creating sample services:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleServices()