'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, X, CreditCard } from 'lucide-react'
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
  const [isDismissed, setIsDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has completed Stripe Connect
  const isComplete = stripePayoutsEnabled

  // Check dismissal from localStorage
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('stripeConnectAlertDismissed')
    if (dismissedUntil) {
      const dismissTime = parseInt(dismissedUntil, 10)
      const now = Date.now()
      // Auto-dismiss expires after 24 hours
      if (now < dismissTime) {
        setIsDismissed(true)
      } else {
        localStorage.removeItem('stripeConnectAlertDismissed')
      }
    }
  }, [])

  const handleDismiss = () => {
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    localStorage.setItem('stripeConnectAlertDismissed', expiryTime.toString())
    setIsDismissed(true)
  }

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

  // Don't show if complete or dismissed
  if (isComplete || isDismissed) {
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

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-koi-orange hover:bg-koi-orange/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Set Up Payments Now'}
            </button>

            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Remind Me Later
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
