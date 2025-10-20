'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

interface CategoryCardProps {
  id: string
  name: string
  slug: string
  icon: string
  serviceCount: number
  onClick: (categoryId: string) => void
}

export function CategoryCard({
  id,
  name,
  slug,
  icon,
  serviceCount,
  onClick
}: CategoryCardProps) {
  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1"
      onClick={() => onClick(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(id)
        }
      }}
      aria-label={`Browse ${name} services`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Icon */}
            <div className="text-4xl mb-3" role="img" aria-label={name}>
              {icon}
            </div>

            {/* Category Name */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>

            {/* Service Count */}
            <p className="text-sm text-gray-500">
              {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
            </p>
          </div>

          {/* Arrow Icon */}
          <ArrowRight
            className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
            aria-hidden="true"
          />
        </div>
      </CardContent>
    </Card>
  )
}
