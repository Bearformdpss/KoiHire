'use client'

import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutModal } from './CheckoutModal'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface CheckoutWrapperProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  totalAmount: number
  serviceName: string
  onSuccess: () => void
}

export function CheckoutWrapper({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  serviceName,
  onSuccess
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/service-order/create-payment-intent`,
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success && response.data.clientSecret) {
        setClientSecret(response.data.clientSecret)
      } else {
        throw new Error('Failed to create payment intent')
      }
    } catch (error: any) {
      console.error('Failed to create payment intent:', error)
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
        totalAmount={totalAmount}
        serviceName={serviceName}
        onSuccess={onSuccess}
      />
    </Elements>
  )
}
