'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Search, Filter, MoreVertical, Eye, Edit, ToggleLeft, ToggleRight,
  Star, DollarSign, Clock, TrendingUp, Loader2, ShoppingBag
} from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { servicesApi, Service } from '@/lib/api/services'
import toast from 'react-hot-toast'

export default function FreelancerServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Stats
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0
  })

  useEffect(() => {
    fetchServices()
  }, [activeSearchTerm, statusFilter, sortBy, currentPage])

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const fetchServices = async () => {
    try {
      // Only show full loading spinner on initial load
      // Use isRefreshing for subsequent fetches to avoid losing focus
      if (services.length === 0) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await servicesApi.getMyServices({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        search: activeSearchTerm,
        sortBy,
        order: 'desc'
      })

      console.log('=== FRONTEND MY SERVICES ===')
      console.log('Response:', response)
      console.log('Success:', response.data.success)
      console.log('Data:', response.data.data)
      console.log('============================')

      if (response.data.success && response.data.data) {
        setServices(response.data.data.services)
        setTotalPages(response.data.data.pagination?.pages || 1)

        // Calculate stats
        const allServices = response.data.data.services
        const activeServices = allServices.filter(s => s.isActive)
        const totalOrders = allServices.reduce((sum, s) => sum + s._count.serviceOrders, 0)
        const totalRevenue = allServices.reduce((sum, s) => {
          // Estimate revenue from orders * base price
          return sum + (s._count.serviceOrders * s.basePrice)
        }, 0)
        const avgRating = allServices.reduce((sum, s, _, arr) => {
          return sum + (s.rating || 0) / arr.length
        }, 0)

        setStats({
          totalServices: allServices.length,
          activeServices: activeServices.length,
          totalOrders,
          totalRevenue,
          averageRating: avgRating
        })
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await servicesApi.toggleServiceStatus(serviceId)
      if (response.success) {
        toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`)
        fetchServices()
      }
    } catch (error) {
      toast.error('Failed to update service status')
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      const response = await servicesApi.deleteService(serviceId)
      if (response.success) {
        toast.success('Service deleted successfully')
        fetchServices()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service')
    }
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading && services.length === 0) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your services...</p>
          </div>
        </div>
      </FreelancerOnly>
    )
  }

  return (
    <FreelancerOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Services</h1>
              <p className="text-gray-600">Manage your service listings and track performance</p>
            </div>
            <Button
              onClick={() => router.push('/freelancer/services/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Service
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeServices}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ToggleRight className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.totalOrders}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full md:w-auto">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      onClick={handleSearch}
                      className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Services
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'ACTIVE'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setStatusFilter('INACTIVE')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'INACTIVE'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Inactive Only
                  </button>
                </div>

                {/* Sort Tabs */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSortBy('createdAt')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      sortBy === 'createdAt'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => setSortBy('title')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      sortBy === 'title'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Title A-Z
                  </button>
                  <button
                    onClick={() => setSortBy('rating')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      sortBy === 'rating'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Highest Rated
                  </button>
                  <button
                    onClick={() => setSortBy('orders')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      sortBy === 'orders'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Most Orders
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          {services.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first service to start earning from your skills
                </p>
                <Button
                  onClick={() => router.push('/freelancer/services/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {service.title}
                          </h3>
                          <Badge className={getStatusColor(service.isActive)}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {service.isFeatured && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              Featured
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {service.shortDescription || service.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Starting Price</p>
                            <p className="font-semibold text-green-600">${service.basePrice}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Orders</p>
                            <button
                              onClick={() => router.push(`/freelancer/orders?serviceId=${service.id}`)}
                              className="font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-all"
                              title="View orders for this service"
                            >
                              {service._count.serviceOrders}
                            </button>
                          </div>
                          <div>
                            <p className="text-gray-500">Rating</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {service.rating ? service.rating.toFixed(1) : '—'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500">Views</p>
                            <p className="font-semibold">{service.views}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/services/${service.id}`)}
                          title="Preview service"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/freelancer/services/${service.id}/edit`)}
                          title="Edit service"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>


                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(service.id, service.isActive)}
                          className={service.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                          title={service.isActive ? 'Deactivate service' : 'Activate service'}
                        >
                          {service.isActive ? (
                            <ToggleLeft className="w-4 h-4" />
                          ) : (
                            <ToggleRight className="w-4 h-4" />
                          )}
                        </Button>

                        <div className="relative group">
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete Service
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Service packages preview */}
                    {service.packages && service.packages.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Packages:</p>
                        <div className="flex items-end justify-between gap-4">
                          <div className="flex flex-wrap gap-2 flex-1">
                            {service.packages.map((pkg, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {pkg.tier}: ${pkg.price}
                              </Badge>
                            ))}
                          </div>
                          {service._count.serviceOrders > 0 && (
                            <Button
                              onClick={() => router.push(`/freelancer/orders?serviceId=${service.id}`)}
                              className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0"
                              size="sm"
                            >
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              View Orders ({service._count.serviceOrders})
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                      <span>Created: {formatDate(service.createdAt)}</span>
                      <span>Category: {service.category.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

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

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                        size="sm"
                      >
                        {page}
                      </Button>
                    ))}

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
            </div>
          )}
        </div>
      </div>
    </FreelancerOnly>
  )
}