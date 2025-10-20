'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Monitor, Smartphone, Bot, Palette, FileText, BarChart, Briefcase } from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  gradient: string
  hoverGradient: string
  count?: string
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    icon: Monitor,
    gradient: 'bg-gradient-to-br from-blue-100 to-blue-200',
    hoverGradient: 'hover:from-blue-200 hover:to-blue-300',
    count: '1.2k+'
  },
  {
    id: 'mobile-apps',
    name: 'Mobile Apps',
    icon: Smartphone,
    gradient: 'bg-gradient-to-br from-green-100 to-green-200',
    hoverGradient: 'hover:from-green-200 hover:to-green-300',
    count: '800+'
  },
  {
    id: 'ai-automation',
    name: 'AI & Automation',
    icon: Bot,
    gradient: 'bg-gradient-to-br from-purple-100 to-purple-200',
    hoverGradient: 'hover:from-purple-200 hover:to-purple-300',
    count: '450+'
  },
  {
    id: 'design',
    name: 'Design & Branding',
    icon: Palette,
    gradient: 'bg-gradient-to-br from-pink-100 to-pink-200',
    hoverGradient: 'hover:from-pink-200 hover:to-pink-300',
    count: '950+'
  },
  {
    id: 'content',
    name: 'Content & Marketing',
    icon: FileText,
    gradient: 'bg-gradient-to-br from-orange-100 to-orange-200',
    hoverGradient: 'hover:from-orange-200 hover:to-orange-300',
    count: '600+'
  },
  {
    id: 'data-science',
    name: 'Data Science',
    icon: BarChart,
    gradient: 'bg-gradient-to-br from-teal-100 to-teal-200',
    hoverGradient: 'hover:from-teal-200 hover:to-teal-300',
    count: '320+'
  },
  {
    id: 'consulting',
    name: 'Consulting',
    icon: Briefcase,
    gradient: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
    hoverGradient: 'hover:from-yellow-200 hover:to-yellow-300',
    count: '280+'
  }
]

export default function ServiceCategories() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-5">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800">Let our Freelancers Help</h3>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
          {serviceCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <div
                key={category.id}
                className={`category-card flex-shrink-0 rounded-xl p-4 min-w-[160px] border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300 transform hover:-translate-y-1 ${category.gradient} ${category.hoverGradient}`}
                onMouseEnter={() => setActiveCategory(category.id)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link href={`/marketplace?category=${category.id}`} className="block">
                  <div className="text-center">
                    <div className="mb-3 flex justify-center">
                      <div className={`p-2 rounded-lg ${
                        category.id === 'web-development' ? 'bg-blue-500 text-white' :
                        category.id === 'mobile-apps' ? 'bg-green-500 text-white' :
                        category.id === 'ai-automation' ? 'bg-purple-500 text-white' :
                        category.id === 'design' ? 'bg-pink-500 text-white' :
                        category.id === 'content' ? 'bg-orange-500 text-white' :
                        category.id === 'data-science' ? 'bg-teal-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        <IconComponent size={24} />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-800">{category.name}</h4>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}