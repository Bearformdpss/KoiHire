'use client'

import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutModal } from './CheckoutModal'
import { paymentsApi } from '@/lib/api/payments'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CheckoutWrapperProps {
  isOpen: boolean
  onClose: () => void
  orderId?: string  // For service orders
  projectId?: string  // For project escrow
  totalAmount: number
  serviceName: string
  onSuccess: () => void
  // Optional fee breakdown for projects
  baseAmount?: number
  buyerFee?: number
  sellerCommission?: number
}

export function CheckoutWrapper({
  isOpen,
  onClose,
  orderId,
  projectId,
  totalAmount,
  serviceName,
  onSuccess,
  baseAmount,
  buyerFee,
  sellerCommission
}: CheckoutWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !clientSecret) {
      fetchPaymentIntent()
    }
  }, [isOpen])

  const fetchPaymentIntent = async () => {
    setLoading(true)
    try {
      // Use secure cookie-based authentication via paymentsApi
      const isProject = !!projectId

      console.log('🔍 Fetching payment intent:', { isProject, projectId, orderId })

      const response = isProject
        ? await paymentsApi.createProjectPaymentIntent(projectId!)
        : await paymentsApi.createServiceOrderPaymentIntent(orderId!)

      console.log('✅ Payment intent response:', response)

      if (response.success && response.clientSecret) {
        setClientSecret(response.clientSecret)
      } else {
        throw new Error('Failed to create payment intent')
      }
    } catch (error: any) {
      console.error('❌ Failed to create payment intent:', error)
      console.error('❌ Error response:', error.response?.data)
      toast.error(error.response?.data?.message || 'Failed to initialize payment')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setClientSecret(null)
    onClose()
  }

  if (!isOpen) {
    return null
  }

  if (loading || !clientSecret) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#FF6B35', // koi-orange
            colorBackground: '#ffffff',
            colorText: '#1a1a1a',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            borderRadius: '8px'
          }
        }
      }}
    >
      <CheckoutModal
        isOpen={isOpen}
        onClose={handleClose}
        orderId={orderId}
        projectId={projectId}
        totalAmount={totalAmount}
        serviceName={serviceName}
        onSuccess={onSuccess}
        baseAmount={baseAmount}
        buyerFee={buyerFee}
        sellerCommission={sellerCommission}
      />
    </Elements>
  )
}
