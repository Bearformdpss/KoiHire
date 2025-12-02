'use client'

import { Monitor, Smartphone, Palette, FileText, BarChart, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ServiceCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  iconColor: string
}

const serviceCategories: ServiceCategory[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    icon: Monitor,
    iconColor: 'bg-orange-500'
  },
  {
    id: 'mobile-apps',
    name: 'Mobile Apps',
    icon: Smartphone,
    iconColor: 'bg-teal-500'
  },
  {
    id: 'design-creative',
    name: 'Design & Creative',
    icon: Palette,
    iconColor: 'bg-yellow-500'
  },
  {
    id: 'writing-translation',
    name: 'Writing & Translation',
    icon: FileText,
    iconColor: 'bg-orange-400'
  },
  {
    id: 'marketing-seo',
    name: 'Marketing & SEO',
    icon: TrendingUp,
    iconColor: 'bg-red-500'
  },
  {
    id: 'data-analytics',
    name: 'Data & Analytics',
    icon: BarChart,
    iconColor: 'bg-teal-600'
  }
]

export function HomepageCategoryCards() {
  const router = useRouter()

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold text-koi-navy mb-6">Find what you're looking for</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {serviceCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <button
              key={category.id}
              onClick={() => router.push(`/services?category=${category.id}`)}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300 transform hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="mb-3 flex justify-center">
                  <div className={`p-3 rounded-2xl ${category.iconColor} text-white transition-colors duration-300 hover:bg-white hover:text-koi-navy`}>
                    <IconComponent size={28} strokeWidth={2} />
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-gray-800">
                  {category.name}
                </h4>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
