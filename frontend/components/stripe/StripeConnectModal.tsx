'use client'

import React, { useState } from 'react'
import { X, Lock, DollarSign, Shield, Clock } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const contextText = context === 'service' ? 'create services' : 'apply to projects'

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
            <Lock className="w-8 h-8 text-koi-orange" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Payment Setup Required
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            To {contextText}, you need to set up your payment account with Stripe.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-koi-orange/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-koi-orange" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Instant Payouts</h4>
                <p className="text-gray-600 text-sm">Receive payments immediately when work is approved</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-koi-orange/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-koi-orange" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Secure & Trusted</h4>
                <p className="text-gray-600 text-sm">Powered by Stripe, trusted by millions worldwide</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-koi-orange/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-koi-orange" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Quick Setup</h4>
                <p className="text-gray-600 text-sm">Takes only 5 minutes to complete</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-koi-orange hover:bg-koi-orange/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Set Up Payments Now'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
