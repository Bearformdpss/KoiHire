'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HorizontalScrollCarousel } from '@/components/ui/HorizontalScrollCarousel'
import { ServiceCard } from '@/components/ui/ServiceCard'
import { servicesApi } from '@/lib/api/services'
import { Loader2, Sparkles } from 'lucide-react'

interface Service {
  id: string
  title: string
  coverImage?: string
  basePrice: number
  rating?: number
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
  }
  category: {
    name: string
  }
  _count: {
    reviews: number
  }
}

export function FeaturedServicesSection() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await servicesApi.getServices({
        featured: true,
        limit: 10,
        sortBy: 'rating'
      })

      if (response.data?.success && response.data?.data?.services) {
        setServices(response.data.data.services)
      }
    } catch (error) {
      console.error('Failed to fetch featured services:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-8 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-koi-orange mr-2" />
        <span className="text-gray-600">Loading services...</span>
      </div>
    )
  }

  if (services.length === 0) {
    return null // Don't show section if no services
  }

  return (
    <div className="mb-8">
      <HorizontalScrollCarousel
        title="⭐ Featured Services"
        viewAllText="Browse All Services"
        onViewAll={() => router.push('/services')}
      >
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            title={service.title}
            coverImage={service.coverImage}
            basePrice={service.basePrice}
            rating={service.rating}
            reviewCount={service._count.reviews}
            freelancer={service.freelancer}
            category={service.category}
          />
        ))}
      </HorizontalScrollCarousel>
    </div>
  )
}
