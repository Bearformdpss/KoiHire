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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CategorySidebar } from '@/components/services/CategorySidebar'
import { CategoryCard } from '@/components/services/CategoryCard'
import { FilterChips, FilterChip } from '@/components/services/FilterChips'
import {
  Search, Filter, Star, Clock, User, Eye, Heart,
  Grid, List, SlidersHorizontal, Loader2, Menu, SearchX, Package
} from 'lucide-react'
import { categoriesApi } from '@/lib/api/categories'
import { servicesApi, Service } from '@/lib/api/services'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filters - Initialize from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [totalServices, setTotalServices] = useState(0)

  // Calculate if any filters are active
  const hasActiveFilters = !!(searchTerm || selectedCategory || minPrice || maxPrice)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchServices()
    updateURL()
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortBy, currentPage])

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (selectedCategory) params.set('category', selectedCategory)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
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
      if (minPrice) params.minPrice = parseFloat(minPrice)
      if (maxPrice) params.maxPrice = parseFloat(maxPrice)

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
    setCurrentPage(1)
    setMobileMenuOpen(false) // Close mobile drawer
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
    setCurrentPage(1)
  }

  const removeFilter = (key: string) => {
    switch (key) {
      case 'search':
        setSearchTerm('')
        break
      case 'category':
        setSelectedCategory('')
        break
      case 'price':
        setMinPrice('')
        setMaxPrice('')
        break
    }
    setCurrentPage(1)
  }

  // Build active filter chips
  const activeFilters: FilterChip[] = []
  if (searchTerm) {
    activeFilters.push({ key: 'search', label: `Search: "${searchTerm}"`, value: searchTerm })
  }
  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory)
    if (category) {
      activeFilters.push({ key: 'category', label: category.name, value: selectedCategory })
    }
  }
  if (minPrice || maxPrice) {
    const priceLabel = minPrice && maxPrice
      ? `$${minPrice} - $${maxPrice}`
      : minPrice
      ? `Min $${minPrice}`
      : `Max $${maxPrice}`
    activeFilters.push({ key: 'price', label: priceLabel, value: `${minPrice}-${maxPrice}` })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Service Card Component (existing - keeping compact)
  const ServiceCard = ({ service }: { service: Service }) => (
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
            <span className="text-sm text-gray-600">
              {service.freelancer?.firstName} {service.freelancer?.lastName}
            </span>
            {service.rating && (
              <div className="flex items-center gap-1 ml-auto">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({service._count?.reviews || 0})</span>
              </div>
            )}
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
                {service.deliveryTime} day{service.deliveryTime !== 1 ? 's' : ''}
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

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filters Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Mobile Category Button */}
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden h-12">
                        <Menu className="w-4 h-4 mr-2" />
                        Categories
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Categories</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <CategorySidebar
                          categories={categories}
                          selectedCategoryId={selectedCategory}
                          onSelectCategory={handleCategorySelect}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

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

                  {/* Filter Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-12"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>

                  {/* View Mode */}
                  <div className="hidden md:flex border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Min Price
                        </label>
                        <Input
                          type="number"
                          placeholder="$0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Max Price
                        </label>
                        <Input
                          type="number"
                          placeholder="$1000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter Chips */}
            <FilterChips
              filters={activeFilters}
              onRemove={removeFilter}
              onClearAll={clearFilters}
            />

            {/* Conditional Rendering: Curated Sections OR Filtered Grid */}
            {!hasActiveFilters ? (
              /* CURATED SECTIONS - Show when no filters */
              <div className="space-y-8">
                {/* Popular Categories */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Categories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.slice(0, 6).map((category) => (
                      <CategoryCard
                        key={category.id}
                        id={category.id}
                        name={category.name}
                        slug={category.slug}
                        icon={category.icon || '📦'}
                        serviceCount={category._count?.services || 0}
                        onClick={handleCategorySelect}
                      />
                    ))}
                  </div>
                </section>

                {/* Services Grid */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                      <ServiceCardSkeleton key={i} />
                    ))}
                  </div>
                ) : services.length > 0 ? (
                  <>
                    <section>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Services</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {services.slice(0, 4).map((service) => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <EmptyState
                    icon={Package}
                    title="No services available yet"
                    description="Check back soon! Freelancers are adding new services every day."
                  />
                )}
              </div>
            ) : (
              /* FILTERED SERVICES GRID */
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
                        icon={SearchX}
                        title="No services found"
                        description="Try adjusting your search criteria or browse all categories"
                        action={{
                          label: 'Clear Filters',
                          onClick: clearFilters
                        }}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
