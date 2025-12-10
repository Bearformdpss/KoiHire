'use client'

import React, { useState } from 'react'
import { AlertCircle, CreditCard, Wallet, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api/payments'

interface StripeConnectAlertProps {
  stripeConnectAccountId?: string | null
  stripePayoutsEnabled?: boolean
  payoutMethod?: 'STRIPE' | 'PAYPAL' | 'PAYONEER' | null
  paypalEmail?: string | null
  payoneerEmail?: string | null
}

export function StripeConnectAlert({
  stripeConnectAccountId,
  stripePayoutsEnabled,
  payoutMethod,
  paypalEmail,
  payoneerEmail
}: StripeConnectAlertProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has ANY valid payout method
  const hasStripeConnect = stripeConnectAccountId && stripePayoutsEnabled
  const hasPayPal = payoutMethod === 'PAYPAL' && paypalEmail
  const hasPayoneer = payoutMethod === 'PAYONEER' && payoneerEmail
  const hasValidPayoutMethod = hasStripeConnect || hasPayPal || hasPayoneer

  const handleSetupPayments = async () => {
    setIsLoading(true)
    try {
      const response = await paymentsApi.createConnectAccount()

      if (response.success && response.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl
      } else {
        console.error('Failed to create Stripe Connect account')
        alert('Failed to start Stripe setup. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error)
      alert('Failed to start Stripe setup. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGoToSettings = () => {
    router.push('/settings?tab=payments')
  }

  // Don't show if user has a valid payout method
  if (hasValidPayoutMethod) {
    return null
  }

  return (
    <div className="bg-white border-2 border-koi-orange rounded-lg p-6 shadow-sm mb-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-koi-orange/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-koi-orange" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Set Up Your Payout Method to Accept Work
          </h3>
          <p className="text-gray-600 mb-4">
            Choose how you'd like to receive payments for completed projects and service orders.
            You can use PayPal, Payoneer, or set up Stripe Connect for instant payouts.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={handleGoToSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-koi-orange hover:bg-koi-orange/90 text-white font-medium rounded-lg transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Set Up PayPal or Payoneer
            </button>
            <button
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Set Up Stripe Connect'}
            </button>
          </div>

          {/* Help text */}
          <p className="text-sm text-gray-500 italic">
            PayPal and Payoneer are recommended for international freelancers. Stripe Connect provides instant payouts but may have limited availability in some countries.
          </p>
        </div>
      </div>
    </div>
  )
}
