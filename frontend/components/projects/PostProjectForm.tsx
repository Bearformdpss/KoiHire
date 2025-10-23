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
type FormStep = 'details' | 'premium' | 'review'

interface PremiumUpgrade {
  tier: PremiumTier
  price: number
  title: string
  description: string
  features: string[]
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
      features: ['Standard visibility', 'Basic project listing', 'No additional promotion']
    },
    {
      tier: 'FEATURED',
      price: 49,
      title: 'Featured Project',
      description: 'Stand out with enhanced visibility',
      features: ['Featured badge', '2x more visibility', 'Priority in search results', 'Enhanced styling']
    },
    {
      tier: 'PREMIUM',
      price: 149,
      title: 'Premium Placement',
      description: 'Get maximum exposure to top freelancers',
      features: ['Premium badge', '5x more applications', 'Dashboard recommendations', 'Priority notifications', 'Advanced analytics']
    },
    {
      tier: 'SPOTLIGHT',
      price: 299,
      title: 'Spotlight Status',
      description: 'Exclusive access to elite freelancers',
      features: ['SPOTLIGHT badge', 'Hero carousel placement', 'Top dashboard position', '10x more elite applications', 'Quality guarantee', 'Executive analytics']
    }
  ]

  useEffect(() => {
    fetchCategories()
    fetchSpotlightAvailability()
  }, [])

  const fetchSpotlightAvailability = async () => {
    try {
      // Check how many SPOTLIGHT projects are currently active
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
      // Default to 0 available if we can't check
      setSpotlightSlotsAvailable(0)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories()
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
      if (validateForm()) {
        setCurrentStep('premium')
      }
    } else if (currentStep === 'premium') {
      setCurrentStep('review')
    }
  }

  const handleBack = () => {
    if (currentStep === 'review') {
      setCurrentStep('premium')
    } else if (currentStep === 'premium') {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
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
        // Add premium upgrade information
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

        if (onSuccess) {
          onSuccess()
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
      {/* Header with step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center space-x-2 ${
            currentStep === 'details' ? 'text-blue-600' : 
            ['premium', 'review'].includes(currentStep) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'details' ? 'bg-blue-600 text-white' :
              ['premium', 'review'].includes(currentStep) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {['premium', 'review'].includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="font-medium">Project Details</span>
          </div>
          
          <div className={`w-12 h-px ${
            ['premium', 'review'].includes(currentStep) ? 'bg-green-600' : 'bg-gray-200'
          }`} />
          
          <div className={`flex items-center space-x-2 ${
            currentStep === 'premium' ? 'text-blue-600' : 
            currentStep === 'review' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'premium' ? 'bg-blue-600 text-white' :
              currentStep === 'review' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {currentStep === 'review' ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <span className="font-medium">Boost Project</span>
          </div>
          
          <div className={`w-12 h-px ${
            currentStep === 'review' ? 'bg-green-600' : 'bg-gray-200'
          }`} />
          
          <div className={`flex items-center space-x-2 ${
            currentStep === 'review' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span className="font-medium">Review & Post</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          <p className="text-gray-500 text-sm mt-1">{formData.title.length}/200 characters</p>
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={5000}
          />
          {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          <p className="text-gray-500 text-sm mt-1">{formData.description.length}/5000 characters</p>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Requirements (Optional)
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
            placeholder="Any specific technologies, platforms, or requirements?"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2000}
          />
          <p className="text-gray-500 text-sm mt-1">{formData.requirements.length}/2000 characters</p>
        </div>

        {/* Budget */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Minimum Budget (USD) *
            </label>
            <input
              type="number"
              value={formData.minBudget}
              onChange={(e) => setFormData(prev => ({ ...prev, minBudget: e.target.value }))}
              placeholder="500"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.minBudget && <p className="text-red-600 text-sm mt-1">{errors.minBudget}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Budget (USD) *
            </label>
            <input
              type="number"
              value={formData.maxBudget}
              onChange={(e) => setFormData(prev => ({ ...prev, maxBudget: e.target.value }))}
              placeholder="2000"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.maxBudget && <p className="text-red-600 text-sm mt-1">{errors.maxBudget}</p>}
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={500}
          />
          {errors.timeline && <p className="text-red-600 text-sm mt-1">{errors.timeline}</p>}
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 min-w-32"
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
        </div>
      </form>
    </div>
  )
}