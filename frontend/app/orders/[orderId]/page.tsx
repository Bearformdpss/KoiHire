'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Clock, RotateCw, Package, User, Calendar, MessageCircle, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import { serviceOrdersApi, ServiceOrder } from '@/lib/api/service-orders'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await serviceOrdersApi.getOrder(orderId)

      // Handle different response structures
      const responseData = response.data?.data || response.data
      const orderData = responseData?.order || responseData?.serviceOrder || responseData

      if (orderData && orderData.id) {
        setOrder(orderData)
      } else {
        toast.error('Order not found')
        router.push('/freelancer/orders')
      }
    } catch (error: any) {
      console.error('Failed to fetch order:', error)
      if (error.response?.status === 403) {
        toast.error('You do not have permission to view this order')
      } else if (error.response?.status === 404) {
        toast.error('Order not found')
      } else {
        toast.error('Failed to load order')
      }
      router.push('/freelancer/orders')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      ACCEPTED: { label: 'Accepted', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      DELIVERED: { label: 'Delivered', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      REVISION_REQUESTED: { label: 'Revision Requested', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
      DISPUTED: { label: 'Disputed', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    return <Badge className={`${config.className} border`}>{config.label}</Badge>
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Payment Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      PAID: { label: 'Paid (In Escrow)', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      RELEASED: { label: 'Payment Released', className: 'bg-green-100 text-green-800 border-green-200' },
      REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }

    const config = statusConfig[paymentStatus] || statusConfig.PENDING
    return <Badge className={`${config.className} border`}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(order.status)}
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </div>
        </div>

        {/* Payment Pending Notice */}
        {order.paymentStatus === 'PENDING' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Payment Required</h3>
              <p className="text-sm text-yellow-800 mt-1">
                This order is pending payment. Payment processing will be integrated soon. Once payment is complete,
                funds will be held securely in escrow until you approve the delivered work.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {order.service.coverImage && (
                    <img
                      src={order.service.coverImage}
                      alt={order.service.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/services/${order.serviceId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {order.service.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.service.category?.name}
                    </p>
                  </div>
                </div>

                {/* Package Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {order.package.tier} Package
                    </h3>
                    <span className="text-2xl font-bold text-green-600">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {order.package.description}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {order.package.deliveryTime} days delivery
                    </div>
                    <div className="flex items-center gap-1">
                      <RotateCw className="w-4 h-4" />
                      {order.package.revisions} revisions
                    </div>
                  </div>
                </div>

                {/* Features */}
                {order.package.features && order.package.features.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Included:</h4>
                    <ul className="space-y-1">
                      {order.package.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            {order.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {order.requirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order Placed</p>
                      <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {order.status !== 'PENDING' && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Order Status</p>
                        <p className="text-sm text-gray-600">{order.status}</p>
                      </div>
                    </div>
                  )}

                  {order.deliveryDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Expected Delivery</p>
                        <p className="text-sm text-gray-600">{formatDate(order.deliveryDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle>Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {order.freelancer.firstName?.[0]}{order.freelancer.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.freelancer.firstName} {order.freelancer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">@{order.freelancer.username}</p>
                  </div>
                </div>
                {order.conversationId && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/messages?conversationId=${order.conversationId}`)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Package Price</span>
                  <span className="font-medium text-gray-900">
                    ${order.package.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium text-gray-900">$0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {order.status === 'PENDING' && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Cancel Order
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
