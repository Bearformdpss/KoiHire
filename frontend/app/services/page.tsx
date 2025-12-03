'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CategoryPills } from '@/components/services/CategoryPills'
import {
  Search, Star, Clock, User, Eye, Heart,
  Loader2, SearchX, Package
} from 'lucide-react'
import { categoriesApi } from '@/lib/api/categories'
import { servicesApi, Service } from '@/lib/api/services'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  subcategories?: Array<{
    id: string
    name: string
    slug: string
  }>
  _count?: {
    services?: number
    projects?: number
  }
}

export default function ServicesMarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters - Initialize from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [totalServices, setTotalServices] = useState(0)

  // Calculate if any filters are active
  const hasActiveFilters = !!(searchTerm || selectedCategory)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchServices()
    updateURL()
  }, [searchTerm, selectedCategory, selectedSubcategory, sortBy, currentPage])

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory)
    if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy)
    if (currentPage > 1) params.set('page', currentPage.toString())

    const queryString = params.toString()
    const newURL = queryString ? `/services?${queryString}` : '/services'
    window.history.replaceState({}, '', newURL)
  }

  const fetchInitialData = async () => {
    try {
      const categoriesResponse = await categoriesApi.getCategories()
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories)

        // If URL has a category slug instead of ID, convert it to ID
        const categoryParam = searchParams.get('category')
        if (categoryParam) {
          // Check if it's a slug (contains hyphens) rather than an ID
          const categoryBySlug = categoriesResponse.categories.find(
            (cat: any) => cat.slug === categoryParam
          )
          if (categoryBySlug) {
            setSelectedCategory(categoryBySlug.id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy: sortBy,
        order: 'desc'
      }

      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category = selectedCategory

      const response = await servicesApi.getServices(params)

      if (response.data && response.data.data) {
        setServices(response.data.data.services)
        setTotalPages(response.data.data.pagination?.totalPages || 1)
        setTotalServices(response.data.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId || '')
    setSelectedSubcategory('')
    setCurrentPage(1)
  }

  const handleSubcategorySelect = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId || '')
    setCurrentPage(1)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSortBy('newest')
    setCurrentPage(1)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Service Card Component
  const ServiceCard = ({ service }: { service: Service }) => {
    // Calculate minimum delivery time from packages
    const minDeliveryTime = service.packages && service.packages.length > 0
      ? Math.min(...service.packages.map(pkg => pkg.deliveryTime))
      : service.deliveryTime

    return (
      <Card
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer border hover:border-blue-200"
        onClick={() => router.push(`/services/${service.id}`)}
      >
        <CardContent className="p-0">
          <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
            {service.coverImage ? (
              <img
                src={service.coverImage}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-400 text-6xl">🎯</div>
              </div>
            )}

            <div className="absolute top-3 left-3 flex gap-2">
              {service.isFeatured && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Featured</Badge>
              )}
              {service.isActive && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
              )}
            </div>

            <div className="absolute top-3 right-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white border-0 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-gray-600 truncate">
                  {service.freelancer?.firstName} {service.freelancer?.lastName}
                </span>
                {service.freelancer?.rating && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.freelancer.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {service.title}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {service.shortDescription || service.description}
            </p>

            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {service.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {service.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {minDeliveryTime} day{minDeliveryTime !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {service.views || 0}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {formatPrice(service.basePrice)}
                </div>
                <div className="text-xs text-gray-500">Starting at</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading Skeleton
  const ServiceCardSkeleton = () => (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="h-48 w-full rounded-t-lg" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Marketplace</h1>
          <p className="text-gray-600">Discover professional services from talented freelancers</p>
        </div>

        {/* Category Pills */}
        <div className="mb-6">
          <CategoryPills
            categories={categories}
            selectedCategoryId={selectedCategory}
            selectedSubcategoryId={selectedSubcategory}
            onSelectCategory={handleCategorySelect}
            onSelectSubcategory={handleSubcategorySelect}
          />
        </div>

        {/* Search and Sort Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-12 h-12 text-base"
                  />
                </div>
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[200px] h-12">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="orders">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              {loading ? (
                'Loading services...'
              ) : (
                `${totalServices} service${totalServices !== 1 ? 's' : ''} found`
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <EmptyState
                  icon={hasActiveFilters ? SearchX : Package}
                  title={hasActiveFilters ? "No services found" : "No services available yet"}
                  description={
                    hasActiveFilters
                      ? "Try adjusting your search criteria or browse all categories"
                      : "Check back soon! Freelancers are adding new services every day."
                  }
                  action={
                    hasActiveFilters
                      ? {
                          label: 'Clear Filters',
                          onClick: clearFilters
                        }
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(page)}
                          size="sm"
                        >
                          {page}
                        </Button>
                      )
                    })}

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
