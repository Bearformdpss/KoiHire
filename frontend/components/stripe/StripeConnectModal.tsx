'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Lock, DollarSign, Shield, Clock, Wallet, CreditCard } from 'lucide-react'
import { paymentsApi } from '@/lib/api/payments'

interface StripeConnectModalProps {
  isOpen: boolean
  onClose: () => void
  context: 'service' | 'project'
}

export function StripeConnectModal({
  isOpen,
  onClose,
  context
}: StripeConnectModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const contextText = context === 'service' ? 'create services' : 'apply to projects'

  const handleSetupStripe = async () => {
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
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-koi-orange/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-koi-orange" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Payment Setup Required
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            To {contextText}, you need to set up a payout method to receive payments.
          </p>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* PayPal/Payoneer Option */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-koi-orange/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-koi-orange" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">PayPal or Payoneer</h4>
                  <p className="text-gray-600 text-xs mt-1">Best for international freelancers. Quick setup - just enter your email.</p>
                </div>
              </div>
              <button
                onClick={handleGoToSettings}
                className="w-full mt-3 py-2 px-4 bg-koi-orange hover:bg-koi-orange/90 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Set Up PayPal/Payoneer
              </button>
            </div>

            {/* Stripe Connect Option */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Stripe Connect</h4>
                  <p className="text-gray-600 text-xs mt-1">Instant automatic payouts. Limited country availability.</p>
                </div>
              </div>
              <button
                onClick={handleSetupStripe}
                disabled={isLoading}
                className="w-full mt-3 py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg transition-colors text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Set Up Stripe Connect'}
              </button>
            </div>
          </div>

          {/* Benefits summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span>All payment methods are secure and trusted</span>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
