'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, RefreshCw, ShoppingCart, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ServicePackage {
  id?: string
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM'
  title: string
  description: string
  price: number
  deliveryTime: number
  revisions: number
  features: string[]
}

interface PackageSelectorProps {
  packages: ServicePackage[]
  selectedTier: 'BASIC' | 'STANDARD' | 'PREMIUM'
  onSelectTier: (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => void
  onOrder: (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => void
  onContact: () => void
  isOrdering?: boolean
  className?: string
}

export function PackageSelector({
  packages,
  selectedTier,
  onSelectTier,
  onOrder,
  onContact,
  isOrdering,
  className
}: PackageSelectorProps) {
  const selectedPackage = packages.find(pkg => pkg.tier === selectedTier)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (packages.length === 0) {
    return null
  }

  // Sort packages by tier order
  const sortedPackages = [...packages].sort((a, b) => {
    const order = { BASIC: 1, STANDARD: 2, PREMIUM: 3 }
    return order[a.tier] - order[b.tier]
  })

  return (
    <Card className={cn("sticky top-6", className)}>
      <CardHeader>
        <CardTitle>Choose a Package</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Package Tier Tabs */}
        <div className="flex border rounded-lg overflow-hidden">
          {sortedPackages.map((pkg, index) => (
            <button
              key={pkg.tier}
              onClick={() => onSelectTier(pkg.tier)}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium transition-all",
                selectedTier === pkg.tier
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50 bg-white",
                index === 0 && "rounded-l-lg",
                index === sortedPackages.length - 1 && "rounded-r-lg"
              )}
            >
              {pkg.tier}
            </button>
          ))}
        </div>

        {/* Selected Package Details */}
        {selectedPackage && (
          <div className="space-y-4">
            {/* Package Title & Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">
                {selectedPackage.title}
              </h3>
              <p className="text-sm text-gray-600 break-words line-clamp-3">
                {selectedPackage.description}
              </p>
            </div>

            {/* Price */}
            <div className="text-center py-2">
              <div className="text-4xl font-bold text-green-600">
                {formatPrice(selectedPackage.price)}
              </div>
            </div>

            {/* Delivery & Revisions */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {selectedPackage.deliveryTime} day{selectedPackage.deliveryTime !== 1 ? 's' : ''} delivery
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {selectedPackage.revisions} revision{selectedPackage.revisions !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">What's included:</h4>
              <ul className="space-y-2">
                {selectedPackage.features
                  .filter(f => f && f.trim())
                  .map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 break-all flex-1 min-w-0">
                        {feature}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Order Button */}
            <Button
              onClick={() => onOrder(selectedPackage.tier)}
              disabled={isOrdering}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold"
              size="lg"
            >
              {isOrdering ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Now ({formatPrice(selectedPackage.price)})
                </>
              )}
            </Button>

            {/* Contact Button */}
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={onContact}
              disabled={isOrdering}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
