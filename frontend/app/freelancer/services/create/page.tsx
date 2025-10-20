'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { categoriesApi } from '@/lib/api/categories'
import { skillsApi } from '@/lib/api/skills'
import { servicesApi, CreateServiceData, ServicePackage, ServiceFAQ } from '@/lib/api/services'
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

interface Skill {
  id: string
  name: string
  categoryId: string
}

export default function CreateServicePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

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
    skills: [],
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
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, skillsResponse] = await Promise.all([
        categoriesApi.getCategories(),
        skillsApi.getSkills()
      ])

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories)
      }

      if (skillsResponse.success) {
        setSkills(skillsResponse.skills || [])
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      toast.error('Failed to load form data')
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
        if (formData.skills.length === 0) {
          toast.error('Please select at least one skill')
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
        // Media is optional, but validate URLs if provided
        if (formData.videoUrl && !isValidUrl(formData.videoUrl)) {
          toast.error('Please enter a valid video URL')
          return false
        }
        return true

      case 4: // Requirements
        // Requirements and FAQs are optional
        return true

      case 5: // Preview
        // Final validation before submission
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

  const handleSubmit = async () => {
    if (!validateStep(5)) return

    try {
      setSubmitting(true)

      // Separate real skills from custom skills
      const realSkills = formData.skills.filter(skillId => !skillId.startsWith('custom_'))
      const customSkillIds = formData.skills.filter(skillId => skillId.startsWith('custom_'))

      // Extract custom skill names from the IDs and add to tags
      const customSkillNames = customSkillIds.map(id => {
        // Extract skill name from ID format: custom_timestamp_skillname
        // The skill name starts after "custom_timestamp_"
        const match = id.match(/^custom_\d+_(.+)$/)
        return match ? match[1].replace(/_/g, ' ') : id
      }).filter(name => name && !name.startsWith('custom_'))

      // Combine existing tags with custom skill names
      const allTags = [...formData.tags, ...customSkillNames].filter(tag => tag.trim())

      // If no real skills, we need to handle this case
      // Backend requires at least 1 skill, so if all are custom, we need to pick a generic one
      let skillsToSend = realSkills
      if (skillsToSend.length === 0 && customSkillIds.length > 0) {
        // Find a generic skill from the selected category to satisfy validation
        const categorySkills = skills.filter(s => s.categoryId === formData.categoryId)
        if (categorySkills.length > 0) {
          skillsToSend = [categorySkills[0].id]
        }
      }

      // Prepare form data
      const submitData: CreateServiceData = {
        ...formData,
        // Only send real skill IDs (custom skills go in tags)
        skills: skillsToSend,
        // Set base price to the basic package price
        basePrice: formData.packages.find(p => p.tier === 'BASIC')?.price || formData.packages[0]?.price || 0,
        // Clean up empty fields - shortDescription must be 20-300 chars or not sent at all
        shortDescription: formData.shortDescription?.trim() && formData.shortDescription.trim().length >= 20 && formData.shortDescription.trim().length <= 300 ? formData.shortDescription.trim() : undefined,
        requirements: formData.requirements?.trim() || undefined,
        videoUrl: formData.videoUrl?.trim() || undefined,
        tags: allTags,
        galleryImages: formData.galleryImages?.filter(img => img.trim()) || [],
        faqs: formData.faqs?.filter(faq => faq.question.trim() && faq.answer.trim()) || []
      }

      // Remove shortDescription entirely if it's undefined (backend Joi validation issue)
      if (!submitData.shortDescription) {
        delete submitData.shortDescription
      }

      console.log('Submitting service data:', submitData)
      console.log('Skills to send:', skillsToSend)
      console.log('Custom skills as tags:', customSkillNames)

      console.log('About to call createService API...')
      const response = await servicesApi.createService(submitData)
      console.log('API response received:', response)

      if (response.data.success) {
        toast.success('Service created successfully!')
        router.push('/freelancer/services')
      } else {
        console.error('Service creation failed:', response.data)
        toast.error(response.data.message || 'Failed to create service')
      }
    } catch (error: any) {
      console.error('Service creation error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Validation errors:', JSON.stringify(error.response?.data?.errors, null, 2))
      toast.error(error.response?.data?.message || error.message || 'Failed to create service')
    } finally {
      setSubmitting(false)
    }
  }

  const stepTitles = [
    'Basic Details',
    'Packages & Pricing',
    'Gallery & Media',
    'Requirements & FAQ',
    'Preview & Publish'
  ]

  if (loading) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading form data...</p>
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
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Service</h1>
            <p className="text-gray-600">Create a service listing to sell your skills to clients</p>
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
                  skills={skills}
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
                  skills={skills}
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
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Service...
                  </>
                ) : (
                  <>
                    Publish Service
                    <CheckCircle className="w-4 h-4 ml-2" />
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