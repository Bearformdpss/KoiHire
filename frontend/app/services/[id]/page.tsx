'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Heart, Share2, Star, MapPin, Loader2
} from 'lucide-react'
import { ClientOnly } from '@/components/auth/RoleProtection'
import { servicesApi, Service } from '@/lib/api/services'
import { serviceOrdersApi } from '@/lib/api/service-orders'
import toast from 'react-hot-toast'

// New Components
import { ImageCarousel } from '@/components/services/ImageCarousel'
import { PackageSelector } from '@/components/services/PackageSelector'
import { SellerInfoCard } from '@/components/services/SellerInfoCard'
import { FAQAccordion } from '@/components/services/FAQAccordion'
import { RelatedServices } from '@/components/services/RelatedServices'
import { Lightbox } from '@/components/services/Lightbox'
import { OrderServiceModal } from '@/components/services/OrderServiceModal'

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string

  const [service, setService] = useState<Service | null>(null)
  const [relatedServices, setRelatedServices] = useState<Service[]>([])
  const [freelancerReviews, setFreelancerReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>('BASIC')

  // Order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderPackageTier, setOrderPackageTier] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>('BASIC')

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    if (serviceId) {
      fetchService()
      fetchRelatedServices()
    }
  }, [serviceId])

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await servicesApi.getService(serviceId)

      if (response.data?.data?.service) {
        const serviceData = response.data.data.service
        setService(serviceData)

        // Fetch freelancer reviews
        if (serviceData.freelancer?.id) {
          fetchFreelancerReviews(serviceData.freelancer.id)
        }

        // Default to BASIC package or first available package
        if (serviceData.packages && serviceData.packages.length > 0) {
          const basicPackage = serviceData.packages.find(p => p.tier === 'BASIC')
          if (basicPackage) {
            setSelectedPackage('BASIC')
          } else {
            setSelectedPackage(serviceData.packages[0].tier as 'BASIC' | 'STANDARD' | 'PREMIUM')
          }
        }
      } else {
        toast.error('Service not found')
        router.push('/services')
      }
    } catch (error) {
      console.error('Failed to fetch service:', error)
      toast.error('Failed to load service')
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }

  const fetchFreelancerReviews = async (freelancerId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/user/${freelancerId}?type=received&limit=10`)
      const data = await response.json()

      if (data.success && data.reviews) {
        setFreelancerReviews(data.reviews)
      }
    } catch (error) {
      console.error('Failed to fetch freelancer reviews:', error)
      // Don't show error to user, just log it
    }
  }

  const fetchRelatedServices = async () => {
    try {
      // Fetch services from same category
      const response = await servicesApi.getServices({
        limit: 4,
        sortBy: 'rating',
        order: 'desc'
      })

      if (response.data?.data?.services) {
        // Filter out current service
        const filtered = response.data.data.services.filter((s: Service) => s.id !== serviceId)
        setRelatedServices(filtered.slice(0, 4))
      }
    } catch (error) {
      console.error('Failed to fetch related services:', error)
    }
  }

  const handleOpenOrderModal = (packageTier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    setOrderPackageTier(packageTier)
    setOrderModalOpen(true)
  }

  const handleOrderSuccess = (orderId: string) => {
    setOrderModalOpen(false)
    toast.success('Order placed successfully!')
    router.push(`/orders/${orderId}`)
  }

  const handleContactSeller = () => {
    toast.info('Contact feature coming soon!')
  }

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const handleLightboxNavigate = (direction: 'prev' | 'next') => {
    const allImages = service?.coverImage
      ? [service.coverImage, ...(service.galleryImages || [])]
      : (service?.galleryImages || [])

    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
    } else {
      setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h2>
          <p className="text-gray-600 mb-4">The service you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/services')}>
            Back to Services
          </Button>
        </div>
      </div>
    )
  }

  const allImages = service.coverImage
    ? [service.coverImage, ...(service.galleryImages || [])]
    : (service.galleryImages || [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Navigation & Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline">{service.category?.name}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {service.isFeatured && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Featured</Badge>
            )}
            {service.isActive && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            {service.title}
          </h1>

          {/* Seller Info Inline */}
          <div className="flex items-center gap-4 text-gray-700">
            <button
              onClick={() => service.freelancer?.username && router.push(`/profile/${service.freelancer.username}`)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {service.freelancer?.firstName?.[0]}{service.freelancer?.lastName?.[0]}
              </div>
              <span className="font-medium">
                {service.freelancer?.firstName} {service.freelancer?.lastName}
              </span>
            </button>

            {service.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.rating.toFixed(1)}</span>
                <span className="text-gray-600">({freelancerReviews.length} {freelancerReviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            {service.freelancer?.location && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{service.freelancer.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            <ImageCarousel
              coverImage={service.coverImage}
              galleryImages={service.galleryImages || []}
              videoUrl={service.videoUrl}
              serviceTitle={service.title}
              onImageClick={handleImageClick}
            />

            {/* About This Service */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Service</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Requirements */}
                {service.requirements && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-900 whitespace-pre-line text-sm">
                        {service.requirements}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* About the Seller */}
            <SellerInfoCard
              freelancer={{
                ...service.freelancer!,
                totalOrders: service._count?.serviceOrders || 0
              }}
              reviewCount={freelancerReviews.length}
            />

            {/* FAQ */}
            {service.faqs && service.faqs.length > 0 && (
              <FAQAccordion faqs={service.faqs} maxVisible={5} />
            )}
          </div>

          {/* Right Column (1/3) - Sidebar */}
          <div className="space-y-6">
            {/* Package Selector */}
            {service.packages && service.packages.length > 0 && (
              <PackageSelector
                packages={service.packages}
                selectedTier={selectedPackage}
                onSelectTier={setSelectedPackage}
                onOrder={handleOpenOrderModal}
                onContact={handleContactSeller}
                className="sticky top-6"
              />
            )}

            {/* Service Details Card */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-4">Service Details</h3>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Category</span>
                  <Badge variant="secondary">{service.category?.name}</Badge>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium text-gray-900">
                    {service._count?.serviceOrders || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-medium text-gray-900">
                    {service.views || 0}
                  </span>
                </div>

                {service.tags && service.tags.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {service.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-16">
            <RelatedServices
              services={relatedServices}
              categoryName={service.category?.name}
              onViewMore={() => {
                router.push(`/services?category=${service.categoryId}`)
              }}
            />
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={allImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={handleLightboxNavigate}
      />

      {/* Order Modal */}
      {service && (
        <OrderServiceModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          service={service}
          selectedPackageTier={orderPackageTier}
          onOrderSuccess={handleOrderSuccess}
        />
      )}
    </div>
  )
}
