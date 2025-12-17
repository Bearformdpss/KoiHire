'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminServiceOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getServiceOrders({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setOrders(response.data.orders)
      }
    } catch (error: any) {
      console.error('Failed to fetch service orders:', error)
      toast.error('Failed to load service orders')
    } finally {
      setLoading(false)
    }
  }

  const handleReleasePayment = async (orderId: string) => {
    // Prevent double-click
    if (processingOrderId === orderId) {
      return
    }

    if (!confirm('Are you sure you want to release this payment to the freelancer?')) {
      return
    }

    const reason = prompt('Enter reason for release (optional):')

    setProcessingOrderId(orderId)
    try {
      const response = await adminApi.releaseServiceOrderPayment(orderId, reason || undefined)
      if (response.success) {
        toast.success('Payment released successfully')
        fetchOrders()
      }
    } catch (error: any) {
      console.error('Failed to release payment:', error)
      toast.error(error.message || 'Failed to release payment')
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleRefund = async (orderId: string) => {
    // Prevent double-click
    if (processingOrderId === orderId) {
      return
    }

    const reason = prompt('Enter reason for refund (required):')
    if (!reason) {
      toast.error('Refund reason is required')
      return
    }

    if (!confirm('Are you sure you want to refund this order to the client?')) {
      return
    }

    setProcessingOrderId(orderId)
    try {
      const response = await adminApi.refundServiceOrder(orderId, reason)
      if (response.success) {
        toast.success('Order refunded successfully')
        fetchOrders()
      }
    } catch (error: any) {
      console.error('Failed to refund order:', error)
      toast.error(error.message || 'Failed to refund order')
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleSearch = () => {
    fetchOrders()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Service Orders Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all service orders</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by order number or service title..."
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
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="RELEASED">Released</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No service orders found
              </CardContent>
            </Card>
          ) : (
            orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.service.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                          order.paymentStatus === 'REFUNDED' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          Payment: {order.paymentStatus}
                        </span>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Order Number</p>
                          <p className="font-mono font-medium">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Client</p>
                          <p className="font-medium">{order.client.username}</p>
                          <p className="text-xs text-gray-500">{order.client.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Freelancer</p>
                          <p className="font-medium">{order.freelancer.username}</p>
                          <p className="text-xs text-gray-500">{order.freelancer.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Package</p>
                          <p className="font-medium">{order.package.tier}</p>
                          <p className="text-xs text-gray-500">{order.package.deliveryTime} days</p>
                        </div>
                      </div>

                      {/* Delivery Info */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Revisions Used</p>
                          <p className="font-medium">{order.revisionsUsed} / {order.package.revisions}</p>
                        </div>
                        {order.deliveryDate && (
                          <div>
                            <p className="text-gray-600">Delivery Date</p>
                            <p className="font-medium">{formatDate(order.deliveryDate)}</p>
                          </div>
                        )}
                        {order.deliveredAt && (
                          <div>
                            <p className="text-gray-600">Delivered At</p>
                            <p className="font-medium">{formatDate(order.deliveredAt)}</p>
                          </div>
                        )}
                      </div>

                      {/* Requirements */}
                      {order.requirements && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Requirements:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{order.requirements}</p>
                        </div>
                      )}

                      {/* Recent Transactions */}
                      {order.transactions && order.transactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-2">Recent Transactions:</p>
                          <div className="space-y-2">
                            {order.transactions.map((txn: any) => (
                              <div key={txn.id} className="flex items-center gap-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  txn.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' :
                                  txn.type === 'WITHDRAWAL' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {txn.type}
                                </span>
                                <span className="font-medium">{formatCurrency(txn.amount)}</span>
                                <span className="text-gray-600">{formatDate(txn.createdAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>Updated: {formatDate(order.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {order.paymentStatus === 'PAID' && (
                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReleasePayment(order.id)}
                          disabled={processingOrderId === order.id}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingOrderId === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Releasing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Release Payment
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(order.id)}
                          disabled={processingOrderId === order.id}
                          className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingOrderId === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Refunding...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Refund
                            </>
                          )}
                        </Button>
                      </div>
                    )}
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
