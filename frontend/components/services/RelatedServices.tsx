'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Clock, Eye, ArrowRight } from 'lucide-react'

interface Service {
  id: string
  title: string
  coverImage?: string
  basePrice: number
  deliveryTime: number
  rating?: number
  views?: number
  isActive: boolean
  isFeatured: boolean
  freelancer?: {
    firstName: string
    lastName: string
  }
  category?: {
    name: string
  }
  _count?: {
    reviews?: number
  }
}

interface RelatedServicesProps {
  services: Service[]
  categoryName?: string
  onViewMore?: () => void
}

export function RelatedServices({ services, categoryName, onViewMore }: RelatedServicesProps) {
  const router = useRouter()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (services.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {categoryName ? `More in ${categoryName}` : 'Related Services'}
        </h2>
        {onViewMore && (
          <Button variant="ghost" onClick={onViewMore} className="group">
            View all
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.slice(0, 4).map((service) => (
          <Card
            key={service.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-blue-200"
            onClick={() => router.push(`/services/${service.id}`)}
          >
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative h-40 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                {service.coverImage ? (
                  <img
                    src={service.coverImage}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-400 text-5xl">🎯</div>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {service.isFeatured && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs">
                      Featured
                    </Badge>
                  )}
                  {service.isActive && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Freelancer */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {service.freelancer?.firstName?.[0] || 'F'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600 truncate">
                    {service.freelancer?.firstName} {service.freelancer?.lastName}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                  {service.title}
                </h3>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {service.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{service.deliveryTime}d</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatPrice(service.basePrice)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
