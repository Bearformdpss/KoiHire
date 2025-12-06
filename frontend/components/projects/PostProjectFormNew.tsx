'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Plus, DollarSign, Clock, FileText, Tag, Star, Crown, TrendingUp, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { categoriesApi } from '@/lib/api/categories'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
}

interface PostProjectFormProps {
  onClose?: () => void
  onSuccess?: () => void
}

type PremiumTier = 'NONE' | 'FEATURED' | 'PREMIUM' | 'SPOTLIGHT'
type FormStep = 'details' | 'review'

interface PremiumUpgrade {
  tier: PremiumTier
  price: number
  title: string
  description: string
  features: string[]
  icon: any
  gradient: string
}

export default function PostProjectForm({ onClose, onSuccess }: PostProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<FormStep>('details')
  const [categories, setCategories] = useState<Category[]>([])
  const [spotlightSlotsAvailable, setSpotlightSlotsAvailable] = useState(3)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    minBudget: '',
    maxBudget: '',
    timeline: '',
    categoryId: '',
    premiumTier: 'NONE' as PremiumTier
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Premium upgrade options
  const premiumOptions: PremiumUpgrade[] = [
    {
      tier: 'NONE',
      price: 0,
      title: 'Standard Posting',
      description: 'Your project will be listed normally',
      features: ['Standard visibility', 'Basic project listing', 'No additional promotion'],
      icon: FileText,
      gradient: 'bg-gray-50 border-gray-200'
    },
    {
      tier: 'FEATURED',
      price: 49,
      title: 'Featured Project',
      description: 'Stand out with enhanced visibility',
      features: ['Featured badge', '2x more visibility', 'Priority in search results', 'Enhanced styling'],
      icon: Star,
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200'
    },
    {
      tier: 'PREMIUM',
      price: 149,
      title: 'Premium Placement',
      description: 'Get maximum exposure to top freelancers',
      features: ['Premium badge', '5x more applications', 'Dashboard recommendations', 'Priority notifications', 'Advanced analytics'],
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200'
    },
    {
      tier: 'SPOTLIGHT',
      price: 299,
      title: 'Spotlight Status',
      description: 'Exclusive access to elite freelancers',
      features: ['SPOTLIGHT badge', 'Hero carousel placement', 'Top dashboard position', '10x more elite applications', 'Quality guarantee', 'Executive analytics'],
      icon: Crown,
      gradient: 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-300'
    }
  ]

  useEffect(() => {
    fetchCategories()
    fetchSpotlightAvailability()
  }, [])

  const fetchSpotlightAvailability = async () => {
    try {
      const response = await projectsApi.getProjects({
        featured: true,
        featuredLevel: 'SPOTLIGHT',
        status: 'OPEN',
        limit: 3
      })
      
      if (response.success && response.data) {
        const activeSpotlights = response.data.projects?.length || 0
        setSpotlightSlotsAvailable(Math.max(0, 3 - activeSpotlights))
      }
    } catch (error) {
      console.error('Failed to fetch spotlight availability:', error)
      setSpotlightSlotsAvailable(0)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories()
      console.log('Categories API response:', response) // Debug log
      setCategories(response.categories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryId
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!formData.description || formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!formData.minBudget || isNaN(Number(formData.minBudget)) || Number(formData.minBudget) <= 0) {
      newErrors.minBudget = 'Please enter a valid minimum budget'
    }

    if (!formData.maxBudget || isNaN(Number(formData.maxBudget)) || Number(formData.maxBudget) <= 0) {
      newErrors.maxBudget = 'Please enter a valid maximum budget'
    }

    if (Number(formData.maxBudget) < Number(formData.minBudget)) {
      newErrors.maxBudget = 'Maximum budget must be greater than minimum budget'
    }

    if (!formData.timeline || formData.timeline.length < 5) {
      newErrors.timeline = 'Please provide a timeline'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 'details') {
      console.log('Attempting to validate form...', formData) // Debug log
      
      // Perform validation and get the errors immediately
      const newErrors: Record<string, string> = {}

      if (!formData.title || formData.title.length < 5) {
        newErrors.title = 'Title must be at least 5 characters'
      }

      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description must be at least 20 characters'
      }

      if (!formData.minBudget || isNaN(Number(formData.minBudget)) || Number(formData.minBudget) <= 0) {
        newErrors.minBudget = 'Please enter a valid minimum budget'
      }

      if (!formData.maxBudget || isNaN(Number(formData.maxBudget)) || Number(formData.maxBudget) <= 0) {
        newErrors.maxBudget = 'Please enter a valid maximum budget'
      }

      if (Number(formData.maxBudget) < Number(formData.minBudget)) {
        newErrors.maxBudget = 'Maximum budget must be greater than minimum budget'
      }

      if (!formData.timeline || formData.timeline.length < 5) {
        newErrors.timeline = 'Please provide a timeline'
      }

      if (!formData.categoryId) {
        newErrors.categoryId = 'Please select a category'
      }

      setErrors(newErrors)
      const isValid = Object.keys(newErrors).length === 0
      
      console.log('Validation result:', isValid, 'Errors:', newErrors) // Debug log
      if (isValid) {
        console.log('Form is valid, proceeding to review step')
        setCurrentStep('review')
      } else {
        console.log('Form validation failed', newErrors)
        // Show a toast with validation errors
        toast.error('Please fill in all required fields')
        // Scroll to first error after a brief delay to allow state update
        setTimeout(() => {
          const firstErrorElement = document.querySelector('.text-red-600')
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    }
  }

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('details')
    }
  }

  const handlePremiumSelect = (tier: PremiumTier) => {
    setFormData(prev => ({ ...prev, premiumTier: tier }))
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 'details': return 'Project Details'
      case 'premium': return 'Boost Your Project'
      case 'review': return 'Review & Post'
      default: return 'Create Project'
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setCurrentStep('details')
      return
    }

    setIsLoading(true)
    try {
      const projectData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || undefined,
        minBudget: Number(formData.minBudget),
        maxBudget: Number(formData.maxBudget),
        timeline: formData.timeline,
        categoryId: formData.categoryId,
        featured: formData.premiumTier !== 'NONE',
        featuredLevel: formData.premiumTier !== 'NONE' ? formData.premiumTier : undefined,
        featuredPrice: formData.premiumTier !== 'NONE' ? premiumOptions.find(opt => opt.tier === formData.premiumTier)?.price : undefined
      }

      const response = await projectsApi.createProject(projectData)

      if (response.success) {
        const selectedUpgrade = premiumOptions.find(opt => opt.tier === formData.premiumTier)
        const successMessage = selectedUpgrade && selectedUpgrade.price > 0
          ? `Project posted with ${selectedUpgrade.title} upgrade!`
          : 'Project posted successfully!'

        toast.success(successMessage)

        // Get the created project from response
        const createdProject = response.data?.data?.project || response.data?.project

        if (onSuccess) {
          // Pass the created project to onSuccess callback
          onSuccess(createdProject)
        } else {
          router.push('/my-projects')
        }
        if (onClose) {
          onClose()
        }
      }
    } catch (error: any) {
      console.error('Failed to post project:', error)
      if (error.response?.data?.errors) {
        toast.error(error.response.data.errors[0] || 'Failed to post project')
      } else {
        toast.error('Failed to post project')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header - Clean and professional */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">{getStepTitle()}</h2>
        <p className="text-gray-600">
          {currentStep === 'details'
            ? 'Tell us about your project to attract the best freelancers'
            : 'Review your project details before posting'}
        </p>
      </div>

      {/* Step Content */}
      {currentStep === 'details' && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Project Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Build a responsive e-commerce website"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project in detail. What do you want to build? What are your goals?"
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              maxLength={2000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements (Optional)
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              placeholder="Any specific requirements, technical specifications, or deliverables?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              maxLength={1000}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.requirements.length}/1000 characters
            </p>
          </div>

          {/* Budget */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Minimum Budget *
              </label>
              <input
                type="number"
                value={formData.minBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, minBudget: e.target.value }))}
                placeholder="500"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
              {errors.minBudget && (
                <p className="mt-1 text-sm text-red-600">{errors.minBudget}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Maximum Budget *
              </label>
              <input
                type="number"
                value={formData.maxBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, maxBudget: e.target.value }))}
                placeholder="2000"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
              {errors.maxBudget && (
                <p className="mt-1 text-sm text-red-600">{errors.maxBudget}</p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Timeline *
            </label>
            <input
              type="text"
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
              placeholder="e.g. 2-3 weeks, 1 month, ASAP"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              maxLength={100}
            />
            {errors.timeline && (
              <p className="mt-1 text-sm text-red-600">{errors.timeline}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
            )}
          </div>
        </div>
      )}

      {currentStep === 'review' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Project</h3>
            
            {/* Project Summary */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{formData.title}</h4>
                <p className="text-gray-600 text-sm">{formData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <span className="ml-2 font-medium">${formData.minBudget} - ${formData.maxBudget}</span>
                </div>
                <div>
                  <span className="text-gray-500">Timeline:</span>
                  <span className="ml-2 font-medium">{formData.timeline}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <div>
          {currentStep !== 'details' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentStep !== 'review' ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#152a45] text-white"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-[#1e3a5f] hover:bg-[#152a45] text-white min-w-32"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Post Project
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}