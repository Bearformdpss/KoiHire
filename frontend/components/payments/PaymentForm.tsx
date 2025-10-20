'use client'

import { useState } from 'react'
import {
  useStripe,
  useElements,
  CardElement,
  PaymentElement,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  amount: number
  projectId: string
  clientSecret?: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function PaymentForm({ 
  amount, 
  projectId, 
  clientSecret, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      if (clientSecret) {
        // Use PaymentElement for newer integration
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payments/success?project=${projectId}`,
          },
          redirect: 'if_required',
        })

        if (error) {
          setPaymentError(error.message || 'Payment failed')
          onError(error.message || 'Payment failed')
        } else {
          toast.success('Payment processed successfully!')
          onSuccess()
        }
      } else {
        // Fallback to CardElement
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          throw new Error('Card element not found')
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        })

        if (error) {
          setPaymentError(error.message || 'Payment method creation failed')
          onError(error.message || 'Payment method creation failed')
        } else {
          // Here you would call your backend to process the payment
          console.log('Payment method created:', paymentMethod)
          toast.success('Payment method created successfully!')
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      setPaymentError(error.message || 'An unexpected error occurred')
      onError(error.message || 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Project Deposit</span>
          <span className="text-lg font-bold text-gray-900">${amount}</span>
        </div>
        <p className="text-xs text-gray-600">
          This amount will be held in escrow until project completion
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Information
          </label>
          {clientSecret ? (
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <PaymentElement />
            </div>
          ) : (
            <div className="p-4 border border-gray-300 rounded-lg bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{paymentError}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Secure Payment</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your payment is processed securely through Stripe. Your card information is never stored on our servers.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-900">Escrow Protection</h4>
              <p className="text-sm text-amber-700 mt-1">
                Funds are held securely until project milestones are completed. You can release payment or request refunds through our dispute resolution process.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay ${amount} Securely
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By clicking "Pay", you agree to our terms of service and acknowledge that funds will be held in escrow until project completion.
      </p>
    </form>
  )
}