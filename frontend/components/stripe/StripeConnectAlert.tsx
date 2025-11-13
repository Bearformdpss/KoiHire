'use client'

import React, { useState } from 'react'
import { AlertCircle, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api/payments'

interface StripeConnectAlertProps {
  stripeConnectAccountId?: string | null
  stripePayoutsEnabled?: boolean
}

export function StripeConnectAlert({
  stripeConnectAccountId,
  stripePayoutsEnabled
}: StripeConnectAlertProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has completed Stripe Connect
  const isComplete = stripePayoutsEnabled

  const handleSetupPayments = async () => {
    setIsLoading(true)
    try {
      const response = await paymentsApi.createConnectAccount()

      if (response.success && response.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl
      } else {
        console.error('Failed to create Stripe Connect account')
        alert('Failed to start payment setup. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error)
      alert('Failed to start payment setup. Please try again.')
      setIsLoading(false)
    }
  }

  // Don't show if complete
  if (isComplete) {
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
            Complete Payment Setup to Accept Work
          </h3>
          <p className="text-gray-600 mb-4">
            You need to set up your Stripe Connect account to receive payments for completed projects and service orders.
            This ensures instant payouts when your work is approved by clients.
          </p>

          {/* Action Button */}
          <button
            onClick={handleSetupPayments}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-koi-orange hover:bg-koi-orange/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            <CreditCard className="w-4 h-4" />
            {isLoading ? 'Loading...' : 'Set Up Payments Now'}
          </button>

          {/* Help text for users who already started setup */}
          <p className="text-sm text-gray-500 italic">
            If you have signed up with Stripe and you're still seeing this banner, please check your Stripe account to ensure all requirements have been submitted.
          </p>
        </div>
      </div>
    </div>
  )
}
