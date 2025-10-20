'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Plus, DollarSign, Clock, FileText, Loader2, ArrowLeft } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { categoriesApi } from '@/lib/api/categories'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  slug: string
  skills: Skill[]
}

interface Skill {
  id: string
  name: string
  description: string
}

interface Project {
  id: string
  title: string
  description: string
  requirements?: string
  minBudget: number
  maxBudget: number
  timeline: string
  categoryId: string
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
  status: string
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([])
  const [project, setProject] = useState<Project | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    minBudget: '',
    maxBudget: '',
    timeline: '',
    categoryId: '',
    skills: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching project data for ID:', projectId)

      // Fetch categories
      console.log('📦 Fetching categories...')
      const categoriesResponse = await categoriesApi.getCategories()
      console.log('📦 Categories response:', categoriesResponse)

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories)
        console.log('✅ Categories loaded:', categoriesResponse.categories.length)
      }

      // Fetch project data
      console.log('🔍 Fetching project...')
      const projectResponse = await projectsApi.getProject(projectId)
      console.log('🔍 Project response:', projectResponse)

      // The API wraps the response - check both possible structures
      const proj = projectResponse.data?.project || projectResponse.project
      console.log('🔍 Extracted project:', proj)

      if (projectResponse.success && proj) {
        console.log('✅ Project loaded:', proj)
        setProject(proj)

        // Find the category
        const category = categoriesResponse.categories.find(
          (cat: Category) => cat.id === proj.categoryId
        )
        console.log('📂 Found category:', category)
        if (category) {
          setSelectedCategory(category)
        }

        // Set selected skills
        const projectSkills = proj.skills.map((s: any) => s.skill)
        console.log('🎯 Project skills:', projectSkills)
        setSelectedSkills(projectSkills)

        // Set form data
        setFormData({
          title: proj.title,
          description: proj.description,
          requirements: proj.requirements || '',
          minBudget: proj.minBudget.toString(),
          maxBudget: proj.maxBudget.toString(),
          timeline: proj.timeline,
          categoryId: proj.categoryId,
          skills: projectSkills.map((s: Skill) => s.id)
        })
        console.log('✅ Form data initialized')
      } else {
        console.error('❌ Project response invalid:', projectResponse)
        toast.error('Failed to load project')
        setTimeout(() => router.push('/dashboard?tab=projects'), 2000)
      }
    } catch (error: any) {
      console.error('💥 Failed to fetch data:', error)
      console.error('💥 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.error(error.response?.data?.message || 'Failed to load project')
      setTimeout(() => router.push('/dashboard?tab=projects'), 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value
    const category = categories.find(cat => cat.id === categoryId)

    setSelectedCategory(category || null)
    setFormData(prev => ({ ...prev, categoryId, skills: [] }))
    setSelectedSkills([])
  }

  const toggleSkill = (skill: Skill) => {
    const isSelected = selectedSkills.some(s => s.id === skill.id)

    if (isSelected) {
      setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(id => id !== skill.id)
      }))
    } else {
      setSelectedSkills(prev => [...prev, skill])
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.id]
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.categoryId) newErrors.categoryId = 'Category is required'
    if (!formData.minBudget || parseFloat(formData.minBudget) <= 0) {
      newErrors.minBudget = 'Minimum budget must be greater than 0'
    }
    if (!formData.maxBudget || parseFloat(formData.maxBudget) <= 0) {
      newErrors.maxBudget = 'Maximum budget must be greater than 0'
    }
    if (parseFloat(formData.minBudget) > parseFloat(formData.maxBudget)) {
      newErrors.maxBudget = 'Maximum budget must be greater than minimum budget'
    }
    if (!formData.timeline.trim()) newErrors.timeline = 'Timeline is required'
    if (formData.skills.length === 0) newErrors.skills = 'Please select at least one skill'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setIsSaving(true)

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim(),
        minBudget: parseFloat(formData.minBudget),
        maxBudget: parseFloat(formData.maxBudget),
        timeline: formData.timeline.trim(),
        categoryId: formData.categoryId,
        skills: formData.skills
      }

      const response = await projectsApi.updateProject(projectId, projectData)

      if (response.success) {
        toast.success('Project updated successfully!')
        router.push('/dashboard?tab=projects')
      } else {
        toast.error(response.message || 'Failed to update project')
      }
    } catch (error: any) {
      console.error('Failed to update project:', error)
      toast.error(error.response?.data?.message || 'Failed to update project')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-koi-orange" />
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard?tab=projects')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <h1 className="text-3xl font-bold text-koi-navy">Edit Project</h1>
            <p className="text-gray-600 mt-2">Update your project details</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Project Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Project Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Build a modern e-commerce website"
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your project in detail..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleCategoryChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
            </div>

            {/* Skills */}
            {selectedCategory && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-koi-navy mb-2">
                  Required Skills *
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.skills.map(skill => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedSkills.some(s => s.id === skill.id)
                          ? 'bg-koi-orange text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
                {errors.skills && <p className="mt-1 text-sm text-red-500">{errors.skills}</p>}
              </div>
            )}

            {/* Budget */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-koi-navy mb-2">
                  Minimum Budget ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="minBudget"
                    value={formData.minBudget}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                      errors.minBudget ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="3000"
                  />
                </div>
                {errors.minBudget && <p className="mt-1 text-sm text-red-500">{errors.minBudget}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-koi-navy mb-2">
                  Maximum Budget ($) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="maxBudget"
                    value={formData.maxBudget}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                      errors.maxBudget ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5000"
                  />
                </div>
                {errors.maxBudget && <p className="mt-1 text-sm text-red-500">{errors.maxBudget}</p>}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Timeline *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent ${
                    errors.timeline ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 6-8 weeks"
                />
              </div>
              {errors.timeline && <p className="mt-1 text-sm text-red-500">{errors.timeline}</p>}
            </div>

            {/* Requirements (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Additional Requirements (Optional)
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-koi-orange focus:border-transparent"
                placeholder="Any specific requirements or preferences..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard?tab=projects')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-koi-orange hover:bg-koi-orange/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthRequired>
  )
}
