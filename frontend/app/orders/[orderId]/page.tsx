'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Clock, RotateCw, Package, User, Calendar, MessageCircle, Loader2, CheckCircle2, AlertCircle, CreditCard, Send, ThumbsUp, RotateCcw
} from 'lucide-react'
import { serviceOrdersApi, ServiceOrder } from '@/lib/api/service-orders'
import { CheckoutWrapper } from '@/components/payments/CheckoutWrapper'
import { ServiceOrderFiles } from '@/components/files/ServiceOrderFiles'
import { SubmitWorkModal } from '@/components/orders/SubmitWorkModal'
import { ServiceReviewModal } from '@/components/orders/ServiceReviewModal'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { user } = useAuthStore()

  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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

  // Check if user is the freelancer for this order
  const isFreelancer = user?.id === order?.freelancerId
  // Check if user is the client for this order
  const isClient = user?.id === order?.clientId

  // Handle delivery submission
  const handleSubmitDelivery = async (data: { title: string; description: string; files: string[] }) => {
    try {
      const response = await serviceOrdersApi.submitDelivery(orderId, data)
      if (response.data?.success) {
        toast.success('Work submitted successfully! The client will be notified.')
        fetchOrder()
      } else {
        toast.error(response.data?.message || 'Failed to submit delivery')
      }
    } catch (error: any) {
      console.error('Submit delivery error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit delivery')
      throw error
    }
  }

  // Handle client approval - show review modal first
  const handleApprove = async () => {
    // Show review modal first
    setShowReviewModal(true)
  }

  // Handle actual approval after review flow
  const handleFinalApproval = async () => {
    setActionLoading(true)
    try {
      const response = await serviceOrdersApi.approveDelivery(orderId)
      if (response.data?.success) {
        toast.success('Delivery approved! Payment has been released to the freelancer.')
        fetchOrder()
      } else {
        toast.error(response.data?.message || 'Failed to approve delivery')
      }
    } catch (error: any) {
      console.error('Approve delivery error:', error)
      toast.error(error.response?.data?.message || 'Failed to approve delivery')
      throw error // Re-throw so modal can handle it
    } finally {
      setActionLoading(false)
    }
  }

  // Handle revision request
  const handleRequestRevision = async () => {
    const reason = prompt('Please describe what changes you need:')
    if (!reason || !reason.trim()) {
      return
    }

    setActionLoading(true)
    try {
      const response = await serviceOrdersApi.requestRevision(orderId, { reason: reason.trim() })
      if (response.data?.success) {
        toast.success('Revision requested. The freelancer will be notified.')
        fetchOrder()
      } else {
        toast.error(response.data?.message || 'Failed to request revision')
      }
    } catch (error: any) {
      console.error('Request revision error:', error)
      toast.error(error.response?.data?.message || 'Failed to request revision')
    } finally {
      setActionLoading(false)
    }
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
        {order.paymentStatus === 'PENDING' && user?.id === order.clientId && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Payment Required</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Complete payment to start your order. Funds will be held securely in escrow until you approve the delivered work.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-koi-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${order.totalAmount.toFixed(2)} Now
            </Button>
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

            {/* Freelancer Actions - Submit Work (when IN_PROGRESS or REVISION_REQUESTED) */}
            {isFreelancer && (order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && order.paymentStatus === 'PAID' && (
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Ready to Deliver?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 mb-4">
                    {order.status === 'REVISION_REQUESTED'
                      ? 'Submit your revised work for client approval.'
                      : 'Submit your completed work for client approval.'}
                  </p>
                  <Button
                    onClick={() => setShowDeliverModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Deliver Work
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Client Actions - Approve or Request Revision */}
            {isClient && order.status === 'DELIVERED' && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">Review Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-green-800 mb-4">
                    The freelancer has delivered their work. Review the files and approve if satisfied, or request revisions if needed.
                  </p>
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading || showReviewModal}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve & Release Payment
                  </Button>
                  <Button
                    onClick={handleRequestRevision}
                    disabled={actionLoading || showReviewModal}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Request Revision
                  </Button>
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
                    <Link
                      href={`/profile/${order.freelancer.username}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {order.freelancer.firstName} {order.freelancer.lastName}
                    </Link>
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
                    ${order.packagePrice ? order.packagePrice.toFixed(2) : order.package.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Buyer Service Fee (2.5%)</span>
                  <span className="font-medium text-gray-900">
                    ${order.buyerFee ? order.buyerFee.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>
                {order.buyerFee && order.buyerFee > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Our 2.5% service fee helps maintain secure payments and platform support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Files */}
            <ServiceOrderFiles orderId={orderId} canUpload={true} />

            {/* General Actions */}
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

      {/* Checkout Modal */}
      {order && (
        <CheckoutWrapper
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          orderId={order.id}
          totalAmount={order.totalAmount}
          serviceName={order.service.title}
          onSuccess={fetchOrder}
        />
      )}

      {/* Submit Work Modal */}
      <SubmitWorkModal
        isOpen={showDeliverModal}
        onClose={() => setShowDeliverModal(false)}
        onSubmit={handleSubmitDelivery}
        orderTitle={order?.service?.title || 'Order'}
      />

      {/* Service Review Modal */}
      {order?.freelancer && (
        <ServiceReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onApprove={handleFinalApproval}
          freelancerId={order.freelancer.id}
          freelancerName={`${order.freelancer.firstName} ${order.freelancer.lastName}`}
          serviceOrderId={orderId}
        />
      )}
    </div>
  )
}
