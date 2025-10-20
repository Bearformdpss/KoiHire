'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Clock, RotateCw, Check, Shield, AlertCircle } from 'lucide-react'
import { Service, ServicePackage } from '@/lib/api/services'
import { serviceOrdersApi } from '@/lib/api/service-orders'

interface OrderServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service
  selectedPackageTier: 'BASIC' | 'STANDARD' | 'PREMIUM'
  onOrderSuccess: (orderId: string) => void
}

export function OrderServiceModal({
  isOpen,
  onClose,
  service,
  selectedPackageTier,
  onOrderSuccess
}: OrderServiceModalProps) {
  const [currentTier, setCurrentTier] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>(selectedPackageTier)
  const [requirements, setRequirements] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MAX_REQUIREMENTS_LENGTH = 2000

  // Get available packages sorted by tier
  const availablePackages = service.packages?.sort((a, b) => {
    const order = { BASIC: 1, STANDARD: 2, PREMIUM: 3 }
    return order[a.tier as keyof typeof order] - order[b.tier as keyof typeof order]
  }) || []

  // Get the currently selected package
  const selectedPackage = availablePackages.find(
    (pkg) => pkg.tier === currentTier
  )

  if (!selectedPackage || availablePackages.length === 0) {
    return null
  }

  const handleClose = () => {
    if (requirements.trim() && !isSubmitting) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirm) return
    }
    setRequirements('')
    setError(null)
    onClose()
  }

  const handlePlaceOrder = async () => {
    if (!selectedPackage) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await serviceOrdersApi.placeOrder(service.id, {
        packageId: selectedPackage.id,
        requirements: requirements.trim() || undefined
      })

      if (response.data?.success && response.data.data?.order) {
        // Reset form
        setRequirements('')
        // Trigger success callback
        onOrderSuccess(response.data.data.order.id)
      } else {
        setError('Failed to place order. Please try again.')
      }
    } catch (err: any) {
      console.error('Order placement error:', err)
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to place order. Please try again.'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_REQUIREMENTS_LENGTH) {
      setRequirements(value)
      setError(null) // Clear errors when user types
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BASIC':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'STANDARD':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PREMIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold">Order Service</DialogTitle>
          <DialogDescription>
            Review your order details and provide any requirements
          </DialogDescription>
        </DialogHeader>

        {/* Package Tier Tabs */}
        {availablePackages.length > 1 && (
          <div className="px-6 pb-4">
            <div className="flex border rounded-lg overflow-hidden">
              {availablePackages.map((pkg, index) => (
                <button
                  key={pkg.tier}
                  onClick={() => setCurrentTier(pkg.tier as 'BASIC' | 'STANDARD' | 'PREMIUM')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                    currentTier === pkg.tier
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50 bg-white'
                  } ${index === 0 ? 'rounded-l-lg' : ''} ${
                    index === availablePackages.length - 1 ? 'rounded-r-lg' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {pkg.tier}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 space-y-6">
          {/* Package Summary */}
          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge className={`mb-2 ${getTierColor(selectedPackage.tier)}`}>
                  {selectedPackage.tier} PACKAGE
                </Badge>
                <h3 className="font-semibold text-lg text-gray-900">
                  {selectedPackage.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {service.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  ${selectedPackage.price.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 text-sm">
              {selectedPackage.description}
            </p>

            {/* Package Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>{selectedPackage.deliveryTime}</strong> days delivery
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCw className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  <strong>{selectedPackage.revisions}</strong>{' '}
                  {selectedPackage.revisions === 1 ? 'revision' : 'revisions'}
                </span>
              </div>
            </div>

            {/* Features */}
            {selectedPackage.features && selectedPackage.features.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  What's included:
                </p>
                <ul className="space-y-2">
                  {selectedPackage.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Requirements Input */}
          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-semibold text-gray-900 mb-2"
            >
              Project Requirements{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <Textarea
              id="requirements"
              placeholder="Describe your project needs, provide links, share your expectations..."
              value={requirements}
              onChange={handleRequirementsChange}
              rows={6}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Help the seller understand exactly what you need
              </p>
              <p className="text-xs text-gray-500">
                {requirements.length}/{MAX_REQUIREMENTS_LENGTH}
              </p>
            </div>
          </div>

          {/* Payment Placeholder */}
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">
                  Secure Payment Processing
                </h4>
                <p className="text-blue-800 text-xs mt-1">
                  Your payment will be held securely in escrow until you approve the
                  completed work. Payment processing will be available in the next step.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Extra spacing before sticky footer */}
          <div className="h-4"></div>
        </div>

        {/* Sticky Bottom Section - Price & Actions */}
        <div className="border-t bg-white px-6 py-4 space-y-4">
          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Package Price</span>
              <span className="font-medium text-gray-900">
                ${selectedPackage.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Fee</span>
              <span className="font-medium text-gray-900">$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-2xl text-gray-900">
                ${selectedPackage.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* "You won't be charged yet" message */}
          <div className="text-center">
            <p className="text-xs text-gray-500">You won't be charged yet</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>Place Order (${selectedPackage.price.toFixed(2)})</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
