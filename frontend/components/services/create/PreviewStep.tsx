'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, RefreshCw, Image, Video, CheckCircle, AlertTriangle } from 'lucide-react'
import { CreateServiceData } from '@/lib/api/services'

interface Category {
  id: string
  name: string
  slug: string
}

interface Skill {
  id: string
  name: string
  categoryId: string
}

interface PreviewStepProps {
  formData: CreateServiceData
  categories: Category[]
  skills: Skill[]
}

export default function PreviewStep({
  formData,
  categories,
  skills
}: PreviewStepProps) {
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId)
  const selectedSkills = skills.filter(skill => formData.skills.includes(skill.id))

  const validationErrors: string[] = []
  const validationWarnings: string[] = []

  // Basic validation
  if (!formData.title.trim()) validationErrors.push('Service title is required')
  if (!formData.description.trim()) validationErrors.push('Service description is required')
  if (!formData.categoryId) validationErrors.push('Category selection is required')
  if (formData.skills.length === 0) validationErrors.push('At least one skill must be selected')
  if (formData.packages.length === 0) validationErrors.push('At least one package is required')

  // Package validation
  formData.packages.forEach((pkg, index) => {
    if (!pkg.title.trim()) validationErrors.push(`Package ${index + 1} title is required`)
    if (!pkg.description.trim()) validationErrors.push(`Package ${index + 1} description is required`)
    if (pkg.price <= 0) validationErrors.push(`Package ${index + 1} price must be greater than 0`)
    if (pkg.features.filter(f => f.trim()).length === 0) {
      validationErrors.push(`Package ${index + 1} must have at least one feature`)
    }
  })

  // Warnings for optional but recommended content
  if (!formData.coverImage) validationWarnings.push('Cover image is recommended for better visibility')
  if (!formData.shortDescription) validationWarnings.push('Short description helps with search results')
  if (!formData.requirements) validationWarnings.push('Specifying requirements helps set client expectations')
  if (!formData.faqs || formData.faqs.length === 0) {
    validationWarnings.push('Adding FAQs can reduce client questions and improve conversions')
  }

  const isReadyToPublish = validationErrors.length === 0

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold mb-2">Preview Your Service</h2>
        <p className="text-gray-600">
          Review your service details before publishing
        </p>
      </div>

      {/* Validation Status */}
      <Card className={`border-2 ${
        isReadyToPublish
          ? validationWarnings.length > 0
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {isReadyToPublish ? (
              <CheckCircle className={`w-5 h-5 mt-0.5 ${
                validationWarnings.length > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">
              <h3 className={`font-medium ${
                isReadyToPublish
                  ? validationWarnings.length > 0
                    ? 'text-yellow-900'
                    : 'text-green-900'
                  : 'text-red-900'
              }`}>
                {isReadyToPublish
                  ? validationWarnings.length > 0
                    ? 'Ready to Publish (with suggestions)'
                    : 'Ready to Publish!'
                  : 'Issues to Fix'
                }
              </h3>

              {validationErrors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-800 font-medium mb-1">Required fixes:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationWarnings.length > 0 && isReadyToPublish && (
                <div className="mt-2">
                  <p className="text-sm text-yellow-800 font-medium mb-1">Suggestions to improve:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isReadyToPublish && validationWarnings.length === 0 && (
                <p className="text-sm text-green-800 mt-1">
                  Your service is complete and ready to be published!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Service Preview
            <Badge variant="secondary" className="text-xs">
              How clients will see your service
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{formData.title || 'Untitled Service'}</h1>
              <Badge variant="outline">Active</Badge>
            </div>
            {formData.shortDescription && (
              <p className="text-gray-600">{formData.shortDescription}</p>
            )}
          </div>

          {/* Media Preview */}
          {(formData.coverImage || formData.galleryImages?.length || formData.videoUrl) && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media Gallery
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.coverImage && (
                  <div className="relative">
                    <img
                      src={formData.coverImage}
                      alt="Cover"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Badge className="absolute top-1 left-1 text-xs">Cover</Badge>
                  </div>
                )}
                {formData.galleryImages?.slice(0, 5).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
                {formData.videoUrl && (
                  <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <Video className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Category & Skills</h3>
              <div className="space-y-2">
                {selectedCategory && (
                  <Badge variant="outline">{selectedCategory.name}</Badge>
                )}
                <div className="flex flex-wrap gap-1">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <div className="prose prose-sm max-w-none">
              {formData.description ? (
                <p className="whitespace-pre-line text-gray-700">{formData.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>
          </div>

          {/* Packages */}
          <div>
            <h3 className="font-medium mb-3">Packages</h3>
            <div className="grid gap-4">
              {formData.packages
                .sort((a, b) => {
                  const order = { BASIC: 1, STANDARD: 2, PREMIUM: 3 }
                  return order[a.tier] - order[b.tier]
                })
                .map((pkg) => (
                  <Card key={pkg.tier} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{pkg.title}</h4>
                          <p className="text-sm text-gray-600">{pkg.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">${pkg.price}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {pkg.deliveryTime} day{pkg.deliveryTime !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">What's included:</p>
                        <ul className="text-sm space-y-1">
                          {pkg.features.filter(f => f.trim()).map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Requirements */}
          {formData.requirements && (
            <div>
              <h3 className="font-medium mb-2">Requirements from Client</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {formData.requirements}
                </p>
              </div>
            </div>
          )}

          {/* FAQs */}
          {formData.faqs && formData.faqs.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-1">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publishing Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">🚀 Ready to Launch?</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Your service will be immediately visible to clients</li>
          <li>• You can edit your service details anytime after publishing</li>
          <li>• Start promoting your service to attract your first clients</li>
          <li>• Monitor your service performance in the dashboard</li>
        </ul>
      </div>
    </div>
  )
}