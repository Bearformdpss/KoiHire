'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Star,
  Eye,
  ShoppingCart,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    featured: undefined as boolean | undefined,
    page: 1,
    limit: 20
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [filters])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getServices({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setServices(response.data.services)
      }
    } catch (error: any) {
      console.error('Failed to fetch services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
    setActionLoading(serviceId)
    try {
      const response = await adminApi.updateServiceStatus(serviceId, !currentStatus)
      if (response.success) {
        toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchServices()
      }
    } catch (error: any) {
      console.error('Failed to update service status:', error)
      toast.error(error.message || 'Failed to update service status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnfeature = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove the featured status from this service?')) {
      return
    }

    setActionLoading(serviceId)
    try {
      const response = await adminApi.unfeatureService(serviceId)
      if (response.success) {
        toast.success('Featured status removed')
        fetchServices()
      }
    } catch (error: any) {
      console.error('Failed to unfeature service:', error)
      toast.error(error.message || 'Failed to unfeature service')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSearch = () => {
    fetchServices()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLowestPrice = (packages: any[]) => {
    if (!packages || packages.length === 0) return 0
    return Math.min(...packages.map((p: any) => p.price))
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Services Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage freelancer services</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, freelancer username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filters.featured === undefined ? '' : filters.featured.toString()}
              onChange={(e) => setFilters({
                ...filters,
                featured: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Services</option>
              <option value="true">Featured Only</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No services found
              </CardContent>
            </Card>
          ) : (
            services.map((service: any) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Service Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          service.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {service.isFeatured && (
                          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                            service.featuredLevel === 'SPOTLIGHT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : service.featuredLevel === 'PREMIUM'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            <Star className="w-3 h-3" />
                            {service.featuredLevel}
                          </span>
                        )}
                      </div>

                      {/* Freelancer Info */}
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Freelancer: </span>
                          <span className="font-medium">@{service.freelancer.username}</span>
                          {service.freelancer.isVerified && (
                            <CheckCircle className="w-3 h-3 text-green-600 inline ml-1" />
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600">Email: </span>
                          <span className="font-medium">{service.freelancer.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category: </span>
                          <span className="font-medium">{service.category.name}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Starting Price</p>
                          <p className="font-bold text-green-600">{formatCurrency(getLowestPrice(service.packages))}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Views</p>
                            <p className="font-medium">{service.views}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-gray-600">Orders</p>
                            <p className="font-medium">{service._count.serviceOrders}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <div>
                            <p className="text-gray-600">Rating</p>
                            <p className="font-medium">
                              {service.rating ? service.rating.toFixed(1) : 'N/A'}
                              {service._count.reviews > 0 && (
                                <span className="text-gray-500 text-xs ml-1">({service._count.reviews})</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Packages</p>
                          <p className="font-medium">{service.packages.length}</p>
                        </div>
                      </div>

                      {/* Packages Preview */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {service.packages.map((pkg: any) => (
                          <span
                            key={pkg.id}
                            className={`px-2 py-1 text-xs rounded ${
                              pkg.isActive
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            {pkg.tier}: {formatCurrency(pkg.price)}
                          </span>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {formatDate(service.createdAt)}</span>
                        <span>-</span>
                        <span>Updated: {formatDate(service.updatedAt)}</span>
                        {service.featuredUntil && (
                          <>
                            <span>-</span>
                            <span>Featured Until: {formatDate(service.featuredUntil)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(service.id, service.isActive)}
                        disabled={actionLoading === service.id}
                        className={service.isActive ? 'text-red-600 border-red-600 hover:bg-red-50' : 'text-green-600 border-green-600 hover:bg-green-50'}
                      >
                        {actionLoading === service.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : service.isActive ? (
                          <ToggleRight className="w-4 h-4 mr-2" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 mr-2" />
                        )}
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      {service.isFeatured && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnfeature(service.id)}
                          disabled={actionLoading === service.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Remove Featured
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/services/${service.id}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Public
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
