'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Save } from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { categoriesApi } from '@/lib/api/categories'
import { servicesApi, CreateServiceData, Service } from '@/lib/api/services'
import toast from 'react-hot-toast'

import BasicDetailsStep from '@/components/services/create/BasicDetailsStep'
import PackagesStep from '@/components/services/create/PackagesStep'
import MediaStep from '@/components/services/create/MediaStep'
import RequirementsStep from '@/components/services/create/RequirementsStep'
import PreviewStep from '@/components/services/create/PreviewStep'

interface Category {
  id: string
  name: string
  slug: string
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string

  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [originalService, setOriginalService] = useState<Service | null>(null)

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  // Form data state
  const [formData, setFormData] = useState<CreateServiceData>({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    basePrice: 0,
    deliveryTime: 7,
    revisions: 3,
    requirements: '',
    coverImage: '',
    galleryImages: [],
    videoUrl: '',
    tags: [],
    packages: [
      {
        tier: 'BASIC',
        title: 'Basic Package',
        description: '',
        price: 0,
        deliveryTime: 7,
        revisions: 1,
        features: ['']
      }
    ],
    faqs: []
  })

  useEffect(() => {
    if (serviceId) {
      fetchServiceAndInitialData()
    }
  }, [serviceId])

  const fetchServiceAndInitialData = async () => {
    try {
      setLoading(true)
      const [serviceResponse, categoriesResponse] = await Promise.all([
        servicesApi.getService(serviceId),
        categoriesApi.getCategories()
      ])

      if (serviceResponse.data?.success && serviceResponse.data?.data) {
        const service = serviceResponse.data.data
        setOriginalService(service)

        // Map service data to form data
        setFormData({
          title: service.title,
          description: service.description,
          shortDescription: service.shortDescription || '',
          categoryId: service.categoryId,
          basePrice: service.basePrice,
          deliveryTime: service.deliveryTime,
          revisions: service.revisions,
          requirements: service.requirements || '',
          coverImage: service.coverImage || '',
          galleryImages: service.galleryImages || [],
          videoUrl: service.videoUrl || '',
          tags: service.tags || [],
          packages: service.packages?.length > 0 ? service.packages.map(pkg => ({
            tier: pkg.tier,
            title: pkg.title,
            description: pkg.description,
            price: pkg.price,
            deliveryTime: pkg.deliveryTime,
            revisions: pkg.revisions,
            features: pkg.features
          })) : [
            {
              tier: 'BASIC',
              title: 'Basic Package',
              description: '',
              price: service.basePrice,
              deliveryTime: service.deliveryTime,
              revisions: service.revisions,
              features: ['']
            }
          ],
          faqs: service.faqs?.map(faq => ({
            question: faq.question,
            answer: faq.answer
          })) || []
        })
      } else {
        toast.error('Service not found')
        router.push('/freelancer/services')
        return
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories)
      }
    } catch (error) {
      console.error('Failed to fetch service data:', error)
      toast.error('Failed to load service data')
      router.push('/freelancer/services')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (updates: Partial<CreateServiceData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Details
        if (!formData.title.trim()) {
          toast.error('Service title is required')
          return false
        }
        if (formData.title.length < 5) {
          toast.error('Service title must be at least 5 characters')
          return false
        }
        if (!formData.description.trim()) {
          toast.error('Service description is required')
          return false
        }
        if (formData.description.length < 50) {
          toast.error('Service description must be at least 50 characters')
          return false
        }
        if (!formData.categoryId) {
          toast.error('Please select a category')
          return false
        }
        return true

      case 2: // Packages
        if (formData.packages.length === 0) {
          toast.error('At least one package is required')
          return false
        }
        for (const pkg of formData.packages) {
          if (!pkg.title.trim()) {
            toast.error(`${pkg.tier} package title is required`)
            return false
          }
          if (!pkg.description.trim()) {
            toast.error(`${pkg.tier} package description is required`)
            return false
          }
          if (pkg.price <= 0) {
            toast.error(`${pkg.tier} package price must be greater than 0`)
            return false
          }
          // Check for more than 2 decimal places
          const decimalPlaces = (pkg.price.toString().split('.')[1] || '').length
          if (decimalPlaces > 2) {
            toast.error(`${pkg.tier} package price cannot have more than 2 decimal places (cents)`)
            return false
          }
          if (pkg.deliveryTime <= 0) {
            toast.error(`${pkg.tier} package delivery time must be greater than 0`)
            return false
          }
          if (pkg.features.filter(f => f.trim()).length === 0) {
            toast.error(`${pkg.tier} package must have at least one feature`)
            return false
          }
        }
        return true

      case 3: // Media
        if (formData.videoUrl && !isValidUrl(formData.videoUrl)) {
          toast.error('Please enter a valid video URL')
          return false
        }
        return true

      case 4: // Requirements
        return true

      case 5: // Preview
        return validateStep(1) && validateStep(2)

      default:
        return true
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSave = async () => {
    if (!validateStep(5)) return

    try {
      setSubmitting(true)

      // Prepare form data
      const submitData: CreateServiceData = {
        ...formData,
        basePrice: formData.packages.find(p => p.tier === 'BASIC')?.price || formData.packages[0]?.price || 0,
        shortDescription: formData.shortDescription?.trim() || undefined,
        requirements: formData.requirements?.trim() || undefined,
        videoUrl: formData.videoUrl?.trim() || undefined,
        tags: formData.tags.filter(tag => tag.trim()),
        galleryImages: formData.galleryImages?.filter(img => img.trim()) || [],
        faqs: formData.faqs?.filter(faq => faq.question.trim() && faq.answer.trim()) || []
      }

      const response = await servicesApi.updateService(serviceId, submitData)

      if (response.success) {
        toast.success('Service updated successfully!')
        router.push('/freelancer/services')
      } else {
        toast.error(response.message || 'Failed to update service')
      }
    } catch (error: any) {
      console.error('Service update error:', error)
      toast.error(error.message || 'Failed to update service')
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitles = [
    'Basic Details',
    'Packages & Pricing',
    'Gallery & Media',
    'Requirements & FAQ',
    'Preview & Update'
  ]

  if (loading) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading service data...</p>
          </div>
        </div>
      </FreelancerOnly>
    )
  }

  return (
    <FreelancerOnly>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Service</h1>
            <p className="text-gray-600">
              Update your service: {originalService?.title}
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
                </span>
                <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />

              {/* Step indicators */}
              <div className="flex justify-between mt-4">
                {stepTitles.map((title, index) => {
                  const stepNumber = index + 1
                  const isActive = stepNumber === currentStep
                  const isCompleted = stepNumber < currentStep

                  return (
                    <div key={stepNumber} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          stepNumber
                        )}
                      </div>
                      <span className={`text-xs text-center max-w-20 ${
                        isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}>
                        {title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{stepTitles[currentStep - 1]}</CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <BasicDetailsStep
                  formData={formData}
                  updateFormData={updateFormData}
                  categories={categories}
                />
              )}

              {currentStep === 2 && (
                <PackagesStep
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}

              {currentStep === 3 && (
                <MediaStep
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}

              {currentStep === 4 && (
                <RequirementsStep
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}

              {currentStep === 5 && (
                <PreviewStep
                  formData={formData}
                  categories={categories}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Service...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Service
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FreelancerOnly>
  )
}