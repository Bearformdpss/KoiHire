'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Search, Filter, Eye, MessageCircle, Download, Clock,
  CheckCircle, AlertCircle, XCircle, Loader2, Calendar,
  DollarSign, User, Package
} from 'lucide-react'
import { ClientOnly } from '@/components/auth/RoleProtection'
import { serviceOrdersApi, ServiceOrder } from '@/lib/api/service-orders'
import { ServiceReviewForm } from '@/components/reviews/ServiceReviewForm'
import toast from 'react-hot-toast'

export default function ClientOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('') // User typing
  const [searchTerm, setSearchTerm] = useState('') // Actual search query
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<ServiceOrder | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [searchTerm, statusFilter, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await serviceOrdersApi.getMyOrders({
        page: currentPage,
        limit: 10,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        order: 'desc'
      })

      // Handle axios response structure
      const responseData = response.data?.data || response.data

      if (responseData && (responseData.orders || responseData.serviceOrders)) {
        const fetchedOrders = responseData.orders || responseData.serviceOrders || []
        setOrders(fetchedOrders)
        setTotalPages(responseData.pagination?.pages || 1)

        // Calculate stats
        const allOrders = fetchedOrders
        const activeStatuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED']
        const activeOrders = allOrders.filter((o: ServiceOrder) => activeStatuses.includes(o.status))
        const completedOrders = allOrders.filter((o: ServiceOrder) => o.status === 'COMPLETED')
        const totalSpent = allOrders.reduce((sum: number, o: ServiceOrder) => sum + o.totalAmount, 0)

        setStats({
          totalOrders: allOrders.length,
          activeOrders: activeOrders.length,
          completedOrders: completedOrders.length,
          totalSpent
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-200 text-orange-900 border border-orange-400'
      case 'ACCEPTED':
        return 'bg-blue-200 text-blue-900 border border-blue-400'
      case 'IN_PROGRESS':
        return 'bg-blue-200 text-blue-900 border border-blue-400'
      case 'DELIVERED':
        return 'bg-purple-200 text-purple-900 border border-purple-400'
      case 'REVISION_REQUESTED':
        return 'bg-orange-200 text-orange-900 border border-orange-400'
      case 'COMPLETED':
        return 'bg-green-200 text-green-900 border border-green-400'
      case 'CANCELLED':
        return 'bg-red-200 text-red-900 border border-red-400'
      case 'DISPUTED':
        return 'bg-red-200 text-red-900 border border-red-400'
      default:
        return 'bg-gray-300 text-gray-900 border border-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4" />
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

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'

    // Use browser's local timezone for display
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSearch = () => {
    setSearchTerm(searchInput)
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleApproveOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    setSelectedOrderForReview(order)
    setShowReviewModal(true)
  }

  const handleFinalApproval = async (reviewData?: any) => {
    if (!selectedOrderForReview) return

    setPendingApproval(true)
    try {
      // Step 1: Approve the order first (status changes to COMPLETED)
      const response = await serviceOrdersApi.approveDelivery(selectedOrderForReview.id)
      if (response.status === 200 || response.data) {
        // Step 2: Submit review if provided (now that order is COMPLETED)
        if (reviewData) {
          try {
            await serviceOrdersApi.submitReview(selectedOrderForReview.id, reviewData)
            toast.success('Order approved and review submitted successfully!')
          } catch (reviewError) {
            console.error('Failed to submit review:', reviewError)
            toast.success('Order approved! (Review submission failed)')
          }
        } else {
          toast.success('Order approved successfully!')
        }

        setShowReviewModal(false)
        setSelectedOrderForReview(null)
        fetchOrders()
      } else {
        toast.error('Failed to approve delivery')
      }
    } catch (error: any) {
      console.error('Failed to approve order:', error)
      toast.error(error.response?.data?.message || 'Failed to approve delivery')
    } finally {
      setPendingApproval(false)
    }
  }

  const handleReviewSuccess = (reviewData: any) => {
    handleFinalApproval(reviewData)
  }

  const handleSkipReview = () => {
    handleFinalApproval()
  }

  const handleRequestRevision = async (orderId: string) => {
    const revisionNote = prompt('Please describe what needs to be revised:')
    if (!revisionNote) return

    try {
      const response = await serviceOrdersApi.requestRevision(orderId, revisionNote)
      if (response.status === 200 || response.data) {
        toast.success('Revision requested successfully!')
        fetchOrders()
      } else {
        toast.error('Failed to request revision')
      }
    } catch (error: any) {
      console.error('Failed to request revision:', error)
      toast.error(error.response?.data?.message || 'Failed to request revision')
    }
  }

  if (loading && orders.length === 0) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </ClientOnly>
    )
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">Track your service orders and deliverables</p>
            </div>
            <Button
              onClick={() => router.push('/services')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Browse Services
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
                    <p className="text-sm font-medium text-gray-600">Active Orders</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
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
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalSpent)}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar - Longer width */}
                <div className="flex gap-2 w-full lg:w-96">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search orders..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 px-4"
                    size="sm"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'ALL'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Orders
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'PENDING'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACCEPTED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'ACCEPTED'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'IN_PROGRESS'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setStatusFilter('DELIVERED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'DELIVERED'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'COMPLETED'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setStatusFilter('CANCELLED')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      statusFilter === 'CANCELLED'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">
                  Start browsing services to place your first order
                </p>
                <Button
                  onClick={() => router.push('/services')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Browse Services
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
                        {/* Service Title and Status */}
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.service?.title}
                          </h3>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Freelancer Info with Avatar */}
                        <div className="flex items-center gap-3 mb-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {order.freelancer?.avatar ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-500">
                              <Image
                                src={order.freelancer.avatar}
                                alt={`${order.freelancer.firstName} ${order.freelancer.lastName}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {order.freelancer?.firstName?.[0]}{order.freelancer?.lastName?.[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {order.freelancer?.firstName} {order.freelancer?.lastName}
                            </p>
                            <p className="text-xs text-gray-600">Freelancer</p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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

                        {order.status === 'DELIVERED' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveOrder(order.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestRevision(order.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Request Revision
                            </Button>
                          </>
                        )}

                        {order.status === 'COMPLETED' && order.deliverables && order.deliverables.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Download deliverables
                              toast('Download feature coming soon!')
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Deliverables */}
                    {order.deliverables && order.deliverables.length > 0 && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                          Deliverables
                        </h4>
                        <div className="space-y-4">
                          {order.deliverables.map((deliverable) => (
                            <div key={deliverable.id} className="bg-gradient-to-br from-blue-50 via-white to-orange-50 border-2 border-blue-400 rounded-xl p-5 shadow-sm">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h5 className="text-lg font-bold text-gray-900 mb-2">{deliverable.title}</h5>
                                  {deliverable.description && (
                                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{deliverable.description}</p>
                                  )}
                                  {/* PROMINENT Delivered Badge */}
                                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-full shadow-md">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold">
                                      DELIVERED: {formatDate(deliverable.submittedAt).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Files */}
                              {deliverable.files && deliverable.files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Download className="w-4 h-4 text-blue-600" />
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                                      Attached Files ({deliverable.files.length})
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    {deliverable.files.map((fileUrl: string, index: number) => {
                                      const fileName = fileUrl.split('/').pop() || `file-${index + 1}`
                                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
                                      return (
                                        <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all">
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {isImage ? (
                                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                                <Eye className="w-4 h-4 text-blue-600" />
                                              </div>
                                            ) : (
                                              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                                                <Download className="w-4 h-4 text-orange-600" />
                                              </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-800 truncate">{fileName}</span>
                                          </div>
                                          <div className="flex gap-2 ml-3">
                                            {isImage && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(`/api${fileUrl}`, '_blank')}
                                                className="h-8 px-3 border-blue-300 text-blue-600 hover:bg-blue-50"
                                                title="View image"
                                              >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                              </Button>
                                            )}
                                            <a href={`/api${fileUrl}`} download>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3 border-orange-300 text-orange-600 hover:bg-orange-50"
                                                title="Download file"
                                              >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                              </Button>
                                            </a>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
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

      {/* Review Modal */}
      {showReviewModal && selectedOrderForReview && selectedOrderForReview.freelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Approve Order</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedOrderForReview(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={pendingApproval}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Service:</strong> {selectedOrderForReview.service?.title}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Freelancer:</strong> {selectedOrderForReview.freelancer.firstName} {selectedOrderForReview.freelancer.lastName}
                </p>
              </div>

              <ServiceReviewForm
                orderId={selectedOrderForReview.id}
                freelancerId={selectedOrderForReview.freelancerId}
                freelancerName={`${selectedOrderForReview.freelancer.firstName} ${selectedOrderForReview.freelancer.lastName}`}
                onSuccess={handleReviewSuccess}
                onCancel={() => {
                  setShowReviewModal(false)
                  setSelectedOrderForReview(null)
                }}
              />

              {/* Skip Review Option */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-3">Don't want to leave a review?</p>
                <Button
                  variant="outline"
                  onClick={handleSkipReview}
                  disabled={pendingApproval}
                  className="w-full sm:w-auto"
                >
                  {pendingApproval ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing Order...
                    </>
                  ) : (
                    'Complete Order Without Review'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientOnly>
  )
}