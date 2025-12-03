'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Eye, MessageCircle, Clock, CheckCircle, AlertCircle,
  XCircle, Loader2, Calendar, DollarSign, User, Package,
  Upload, FileText, Play
} from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { serviceOrdersApi, ServiceOrder } from '@/lib/api/service-orders'
import { SubmitWorkModal } from '@/components/orders/SubmitWorkModal'
import toast from 'react-hot-toast'

export default function FreelancerOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceIdFromURL = searchParams?.get('serviceId')

  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [filteredService, setFilteredService] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [submitWorkModal, setSubmitWorkModal] = useState<{ isOpen: boolean; orderId: string | null; orderTitle: string }>({
    isOpen: false,
    orderId: null,
    orderTitle: ''
  })

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    totalEarned: 0
  })

  // Handle serviceId from URL
  useEffect(() => {
    if (serviceIdFromURL) {
      setFilteredService(serviceIdFromURL)
    }
  }, [serviceIdFromURL])

  useEffect(() => {
    fetchOrders()
  }, [activeTab, currentPage, filteredService])

  const getStatusesForTab = (tab: string): string | undefined => {
    switch (tab) {
      case 'IN_PROGRESS':
        return 'PENDING,ACCEPTED,IN_PROGRESS,DELIVERED,REVISION_REQUESTED'
      case 'COMPLETED':
        return 'COMPLETED'
      case 'ALL':
      default:
        return undefined
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await serviceOrdersApi.getFreelancerOrders({
        page: currentPage,
        limit: 10,
        status: getStatusesForTab(activeTab),
        sortBy: 'createdAt',
        order: 'desc'
      })

      // Handle axios response structure
      const responseData = response.data?.data || response.data

      if (responseData && (responseData.orders || responseData.serviceOrders)) {
        let fetchedOrders = responseData.orders || responseData.serviceOrders || []

        // Filter by service if serviceId is provided
        if (filteredService) {
          fetchedOrders = fetchedOrders.filter((order: ServiceOrder) => order.service?.id === filteredService)
        }

        setOrders(fetchedOrders)
        setTotalPages(responseData.pagination?.pages || 1)

        // Calculate stats
        const allOrders = fetchedOrders
        const inProgressStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED']
        const inProgressOrders = allOrders.filter((o: ServiceOrder) => inProgressStatuses.includes(o.status))
        const completedOrders = allOrders.filter((o: ServiceOrder) => o.status === 'COMPLETED')
        const totalEarned = completedOrders.reduce((sum: number, o: ServiceOrder) => sum + (o.packagePrice || o.totalAmount), 0)

        setStats({
          totalOrders: allOrders.length,
          inProgressOrders: inProgressOrders.length,
          completedOrders: completedOrders.length,
          totalEarned
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await serviceOrdersApi.acceptOrder(orderId)
      const data = response.data?.data || response.data
      if (data || response.status === 200) {
        toast.success('Order accepted successfully!')
        fetchOrders()
      } else {
        toast.error('Failed to accept order')
      }
    } catch (error: any) {
      console.error('Failed to accept order:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to accept order')
    }
  }

  const handleStartWork = async (orderId: string) => {
    try {
      const response = await serviceOrdersApi.startWork(orderId)
      const data = response.data?.data || response.data
      if (data || response.status === 200) {
        toast.success('Work started!')
        fetchOrders()
      } else {
        toast.error('Failed to start work')
      }
    } catch (error: any) {
      console.error('Failed to start work:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to start work')
    }
  }

  const handleSubmitWork = (orderId: string, orderTitle: string) => {
    setSubmitWorkModal({ isOpen: true, orderId, orderTitle })
  }

  const handleSubmitWorkConfirm = async (data: { title: string; description: string; files: string[] }) => {
    if (!submitWorkModal.orderId) return

    try {
      const response = await serviceOrdersApi.submitDeliverable(submitWorkModal.orderId, data)

      const responseData = response.data?.data || response.data
      if (responseData || response.status === 200) {
        toast.success('Work submitted successfully!')
        fetchOrders()
      } else {
        toast.error('Failed to submit work')
      }
    } catch (error: any) {
      console.error('Failed to submit work:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to submit work')
      throw error // Re-throw to let modal handle it
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800'
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800'
      case 'REVISION_REQUESTED':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'DISPUTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4" />
      case 'DELIVERED':
        return <Eye className="w-4 h-4" />
      case 'REVISION_REQUESTED':
        return <AlertCircle className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
      case 'DISPUTED':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return '1 day remaining'
    return `${diffDays} days remaining`
  }

  if (loading && orders.length === 0) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
              <p className="text-gray-600">Manage your service orders and deliverables</p>
              {filteredService && orders.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                    Filtered by: {orders[0]?.service?.title || 'Service'}
                  </Badge>
                  <button
                    onClick={() => {
                      setFilteredService(null)
                      router.push('/freelancer/orders')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>
            <Button
              onClick={() => router.push('/freelancer/services')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Services
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.inProgressOrders}</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalEarned)}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('ALL')
                  setCurrentPage(1)
                }}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg font-semibold">All Orders</div>
                <div className="text-sm opacity-90 mt-1">({stats.totalOrders})</div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('IN_PROGRESS')
                  setCurrentPage(1)
                }}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors border-x border-gray-200 ${
                  activeTab === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg font-semibold">In Progress</div>
                <div className="text-sm opacity-90 mt-1">({stats.inProgressOrders})</div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('COMPLETED')
                  setCurrentPage(1)
                }}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'COMPLETED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-lg font-semibold">Completed</div>
                <div className="text-sm opacity-90 mt-1">({stats.completedOrders})</div>
              </button>
            </div>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">
                  Orders will appear here when clients purchase your services
                </p>
                <Button
                  onClick={() => router.push('/freelancer/services')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Manage Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.service?.title}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status.replace('_', ' ')}
                            </div>
                          </Badge>
                          {order.status === 'IN_PROGRESS' && order.deliveryDate && (
                            <Badge variant="outline" className="text-xs">
                              {getTimeRemaining(order.deliveryDate)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {order.client?.firstName} {order.client?.lastName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Ordered: {formatDate(order.createdAt)}
                          </div>
                          {order.deliveryDate && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Due: {formatDate(order.deliveryDate)}
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 mb-4">
                          Package: {order.package?.tier} - {formatPrice(order.totalAmount)}
                        </p>

                        {order.requirements && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">{order.requirements}</p>
                          </div>
                        )}

                        {order.status === 'REVISION_REQUESTED' && order.deliverables?.[0]?.revisionNote && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-orange-900 text-sm mb-1">Revision Requested</p>
                                <p className="text-sm text-orange-800">{order.deliverables[0].revisionNote}</p>
                                <p className="text-xs text-orange-700 mt-2">
                                  Revisions used: {order.revisionsUsed} of {order.package?.revisions}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/messages?conversationId=${order.conversationId}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>

                        {order.status === 'PENDING' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAcceptOrder(order.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Order
                          </Button>
                        )}

                        {order.status === 'ACCEPTED' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStartWork(order.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Work
                          </Button>
                        )}

                        {(order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmitWork(order.id, order.service?.title || 'Order')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {order.status === 'REVISION_REQUESTED' ? 'Submit Revision' : 'Submit Work'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Deliverables */}
                    {order.deliverables && order.deliverables.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Deliverables:</h4>
                        <div className="space-y-2">
                          {order.deliverables.map((deliverable) => (
                            <div key={deliverable.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div>
                                <p className="font-medium text-gray-900">{deliverable.title}</p>
                                {deliverable.description && (
                                  <p className="text-sm text-gray-600">{deliverable.description}</p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Submitted: {formatDate(deliverable.createdAt)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {deliverable.fileUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(deliverable.fileUrl, '_blank')}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

      {/* Submit Work Modal */}
      <SubmitWorkModal
        isOpen={submitWorkModal.isOpen}
        onClose={() => setSubmitWorkModal({ isOpen: false, orderId: null, orderTitle: '' })}
        onSubmit={handleSubmitWorkConfirm}
        orderTitle={submitWorkModal.orderTitle}
      />
    </FreelancerOnly>
  )
}