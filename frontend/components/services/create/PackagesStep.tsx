'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, X } from 'lucide-react'
import { CreateServiceData, ServicePackage } from '@/lib/api/services'

interface PackagesStepProps {
  formData: CreateServiceData
  updateFormData: (updates: Partial<CreateServiceData>) => void
}

const packageTiers: Array<{
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM'
  label: string
  description: string
  color: string
}> = [
  {
    tier: 'BASIC',
    label: 'Basic',
    description: 'Essential features for basic needs',
    color: 'border-green-200 bg-green-50'
  },
  {
    tier: 'STANDARD',
    label: 'Standard',
    description: 'Most popular with additional features',
    color: 'border-blue-200 bg-blue-50'
  },
  {
    tier: 'PREMIUM',
    label: 'Premium',
    description: 'Complete package with premium features',
    color: 'border-purple-200 bg-purple-50'
  }
]

export default function PackagesStep({
  formData,
  updateFormData
}: PackagesStepProps) {
  const [newFeatures, setNewFeatures] = useState<Record<string, string>>({
    BASIC: '',
    STANDARD: '',
    PREMIUM: ''
  })

  const hasPackage = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    return formData.packages.some(pkg => pkg.tier === tier)
  }

  const getPackage = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    return formData.packages.find(pkg => pkg.tier === tier)
  }

  const addPackage = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    const tierInfo = packageTiers.find(t => t.tier === tier)!

    const newPackage: ServicePackage = {
      tier,
      title: `${tierInfo.label} Package`,
      description: '',
      price: 0,
      deliveryTime: tier === 'BASIC' ? 7 : tier === 'STANDARD' ? 5 : 3,
      revisions: tier === 'BASIC' ? 1 : tier === 'STANDARD' ? 3 : 5,
      features: ['']
    }

    updateFormData({
      packages: [...formData.packages, newPackage]
    })
  }

  const removePackage = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    updateFormData({
      packages: formData.packages.filter(pkg => pkg.tier !== tier)
    })
  }

  const updatePackage = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM', updates: Partial<ServicePackage>) => {
    updateFormData({
      packages: formData.packages.map(pkg =>
        pkg.tier === tier ? { ...pkg, ...updates } : pkg
      )
    })
  }

  const addFeature = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    const feature = newFeatures[tier].trim()
    if (!feature) return

    const pkg = getPackage(tier)
    if (!pkg) return

    updatePackage(tier, {
      features: [...pkg.features.filter(f => f.trim()), feature]
    })

    setNewFeatures(prev => ({ ...prev, [tier]: '' }))
  }

  const removeFeature = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM', index: number) => {
    const pkg = getPackage(tier)
    if (!pkg) return

    updatePackage(tier, {
      features: pkg.features.filter((_, i) => i !== index)
    })
  }

  const updateFeature = (tier: 'BASIC' | 'STANDARD' | 'PREMIUM', index: number, value: string) => {
    const pkg = getPackage(tier)
    if (!pkg) return

    const newFeatures = [...pkg.features]
    newFeatures[index] = value

    updatePackage(tier, { features: newFeatures })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Package Configuration</h2>
        <p className="text-gray-600">
          Create different pricing tiers for your service. At least one package is required.
        </p>
      </div>

      <div className="grid gap-6">
        {packageTiers.map((tierInfo) => {
          const hasThisPackage = hasPackage(tierInfo.tier)
          const pkg = getPackage(tierInfo.tier)

          return (
            <Card
              key={tierInfo.tier}
              className={`${hasThisPackage ? tierInfo.color : 'border-gray-200'}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{tierInfo.label} Package</CardTitle>
                  <p className="text-sm text-gray-600">{tierInfo.description}</p>
                </div>
                {hasThisPackage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePackage(tierInfo.tier)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPackage(tierInfo.tier)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {tierInfo.label}
                  </Button>
                )}
              </CardHeader>

              {hasThisPackage && pkg && (
                <CardContent className="space-y-4">
                  {/* Package Title */}
                  <div>
                    <Label htmlFor={`${tierInfo.tier}-title`}>Package Title</Label>
                    <Input
                      id={`${tierInfo.tier}-title`}
                      value={pkg.title}
                      onChange={(e) => updatePackage(tierInfo.tier, { title: e.target.value })}
                      placeholder={`${tierInfo.label} Package`}
                    />
                  </div>

                  {/* Package Description */}
                  <div>
                    <Label htmlFor={`${tierInfo.tier}-description`}>Description</Label>
                    <Textarea
                      id={`${tierInfo.tier}-description`}
                      value={pkg.description}
                      onChange={(e) => updatePackage(tierInfo.tier, { description: e.target.value })}
                      placeholder="Describe what's included in this package"
                      rows={3}
                    />
                  </div>

                  {/* Price, Delivery, Revisions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`${tierInfo.tier}-price`}>Price ($)</Label>
                      <Input
                        id={`${tierInfo.tier}-price`}
                        type="number"
                        min="1"
                        value={pkg.price}
                        onChange={(e) => updatePackage(tierInfo.tier, { price: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${tierInfo.tier}-delivery`}>Delivery (days)</Label>
                      <Input
                        id={`${tierInfo.tier}-delivery`}
                        type="number"
                        min="1"
                        max="365"
                        value={pkg.deliveryTime}
                        onChange={(e) => updatePackage(tierInfo.tier, { deliveryTime: Number(e.target.value) })}
                        placeholder="7"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${tierInfo.tier}-revisions`}>Revisions</Label>
                      <Input
                        id={`${tierInfo.tier}-revisions`}
                        type="number"
                        min="0"
                        max="50"
                        value={pkg.revisions}
                        onChange={(e) => updatePackage(tierInfo.tier, { revisions: Number(e.target.value) })}
                        placeholder="3"
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label>Features Included</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      List what's included in this package
                    </p>

                    {/* Existing Features */}
                    <div className="space-y-2 mb-3">
                      {pkg.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(tierInfo.tier, index, e.target.value)}
                            placeholder="Feature description"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(tierInfo.tier, index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add New Feature */}
                    <div className="flex gap-2">
                      <Input
                        value={newFeatures[tierInfo.tier]}
                        onChange={(e) => setNewFeatures(prev => ({ ...prev, [tierInfo.tier]: e.target.value }))}
                        placeholder="Add a feature"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addFeature(tierInfo.tier)
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFeature(tierInfo.tier)}
                        disabled={!newFeatures[tierInfo.tier].trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Package Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Package Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with a Basic package to attract budget-conscious clients</li>
          <li>• Create value with Standard and Premium tiers (faster delivery, more revisions)</li>
          <li>• Price your packages to encourage upselling to higher tiers</li>
          <li>• Be specific about what's included in each package</li>
          <li>• Consider offering extras like source files or commercial rights in premium tiers</li>
        </ul>
      </div>

      {/* Package Summary */}
      {formData.packages.length > 0 && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">Package Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.packages
                .sort((a, b) => {
                  const order = { BASIC: 1, STANDARD: 2, PREMIUM: 3 }
                  return order[a.tier] - order[b.tier]
                })
                .map((pkg) => (
                  <div key={pkg.tier} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">{pkg.title}</span>
                      <span className="text-sm text-gray-600 ml-2">
                        ({pkg.deliveryTime} days, {pkg.revisions} revisions)
                      </span>
                    </div>
                    <span className="font-bold text-green-600">${pkg.price}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}