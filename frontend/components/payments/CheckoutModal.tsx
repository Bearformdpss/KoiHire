'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2, CreditCard, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  totalAmount: number
  serviceName: string
  onSuccess: () => void
}

export function CheckoutModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  serviceName,
  onSuccess
}: CheckoutModalProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error('Payment system not loaded')
      return
    }

    setLoading(true)
    console.log('💳 Submitting payment...')

    try {
      // Confirm payment
      console.log('💳 Calling stripe.confirmPayment...')
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}?payment=success`
        },
        redirect: 'if_required'
      })

      console.log('💳 Stripe response:', { error, paymentIntent })

      if (error) {
        console.error('❌ Stripe error:', error)
        toast.error(error.message || 'Payment failed')
        setLoading(false)
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
        console.log('✅ Payment succeeded! Status:', paymentIntent.status)
        toast.success('Payment successful! Funds are now held in escrow.')
        onSuccess()
        onClose()
      } else {
        console.log('⚠️ Unexpected payment status:', paymentIntent?.status)
        toast.error('Payment status unclear, please refresh the page')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error)
      toast.error('Failed to process payment')
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Complete Your Payment
          </DialogTitle>
          <DialogDescription>
            Secure payment for: {serviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Service</span>
              <span className="text-sm font-medium text-gray-900">{serviceName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total Amount</span>
              <span className="text-2xl font-bold text-green-600">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Escrow Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Secure Escrow Protection</h4>
                <p className="text-xs text-blue-800">
                  Your payment will be held securely in escrow until you approve the delivered work.
                  The freelancer only receives payment after you confirm satisfaction.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <PaymentElement />
            </div>

            {/* Test Card Notice (only show in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-medium">
                  Test Mode: Use card 4242 4242 4242 4242, any future expiry, any CVC
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!stripe || loading}
                className="flex-1 bg-gradient-to-r from-koi-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay $${totalAmount.toFixed(2)}`
                )}
              </Button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Lock className="w-3 h-3" />
            <span>Secured by Stripe - PCI DSS compliant</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
