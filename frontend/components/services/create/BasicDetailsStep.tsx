'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
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

interface BasicDetailsStepProps {
  formData: CreateServiceData
  updateFormData: (updates: Partial<CreateServiceData>) => void
  categories: Category[]
  skills: Skill[]
}

// Category keyword mapping for suggestions
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'web-development': ['website', 'web', 'frontend', 'backend', 'react', 'node', 'javascript', 'typescript', 'nextjs', 'vue', 'angular', 'fullstack'],
  'mobile-development': ['mobile', 'app', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
  'design-creative': ['design', 'logo', 'graphic', 'ui', 'ux', 'figma', 'photoshop', 'illustrator', 'branding', 'creative'],
  'writing-translation': ['writing', 'content', 'blog', 'article', 'copywriting', 'translation', 'editing', 'proofreading'],
  'marketing-seo': ['marketing', 'seo', 'social media', 'advertising', 'content marketing', 'email marketing', 'ppc'],
  'data-analytics': ['data', 'analytics', 'analysis', 'machine learning', 'ai', 'python', 'statistics', 'visualization']
}

// Popular tags per category
const POPULAR_TAGS: Record<string, string[]> = {
  'web-development': ['responsive', 'modern', 'fast', 'secure', 'scalable'],
  'mobile-development': ['cross-platform', 'native', 'user-friendly', 'performance', 'intuitive'],
  'design-creative': ['modern', 'minimalist', 'professional', 'creative', 'unique'],
  'writing-translation': ['seo-friendly', 'engaging', 'professional', 'original', 'research-based'],
  'marketing-seo': ['results-driven', 'data-driven', 'conversion', 'growth', 'targeted'],
  'data-analytics': ['accurate', 'insights', 'visualization', 'predictive', 'actionable']
}

export default function BasicDetailsStep({
  formData,
  updateFormData,
  categories,
  skills
}: BasicDetailsStepProps) {
  const [newTag, setNewTag] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([])
  const [customSkills, setCustomSkills] = useState<string[]>([])

  // Filter skills based on selected category
  const filteredSkills = formData.categoryId
    ? skills.filter(skill => skill.categoryId === formData.categoryId)
    : skills

  // Get suggested categories based on title
  const getSuggestedCategories = (title: string): Category[] => {
    if (!title || title.length < 3) return []

    const titleLower = title.toLowerCase()
    const matches = new Map<string, number>()

    // Score each category based on keyword matches
    Object.entries(CATEGORY_KEYWORDS).forEach(([categorySlug, keywords]) => {
      let score = 0
      keywords.forEach(keyword => {
        if (titleLower.includes(keyword.toLowerCase())) {
          score += keyword.length // Longer keywords get higher scores
        }
      })
      if (score > 0) {
        matches.set(categorySlug, score)
      }
    })

    // Sort by score and get top 3
    const sortedMatches = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    // Return matching categories
    return sortedMatches
      .map(([slug]) => categories.find(cat => cat.slug === slug))
      .filter((cat): cat is Category => cat !== undefined)
  }

  // Update suggested categories when title changes
  const handleTitleChange = (newTitle: string) => {
    updateFormData({ title: newTitle })
    const suggestions = getSuggestedCategories(newTitle)
    setSuggestedCategories(suggestions)
  }

  // Get popular tags for selected category
  const getPopularTags = (): string[] => {
    const category = categories.find(c => c.id === formData.categoryId)
    if (!category) return []
    return POPULAR_TAGS[category.slug] || []
  }

  const handleSkillToggle = (skillId: string) => {
    const currentSkills = formData.skills
    const isSelected = currentSkills.includes(skillId)

    if (isSelected) {
      updateFormData({
        skills: currentSkills.filter(id => id !== skillId)
      })
    } else {
      updateFormData({
        skills: [...currentSkills, skillId]
      })
    }
  }

  const addCustomSkill = () => {
    const trimmedSkill = newSkill.trim()
    const currentSkills = formData.skills || []
    if (trimmedSkill && !customSkills.includes(trimmedSkill) && customSkills.length + currentSkills.length < 10) {
      const customSkillId = `custom_${Date.now()}_${trimmedSkill.toLowerCase().replace(/\s+/g, '_')}`
      setCustomSkills([...customSkills, trimmedSkill])
      updateFormData({
        skills: [...currentSkills, customSkillId]
      })
      setNewSkill('')
    }
  }

  const removeCustomSkill = (skillName: string) => {
    const skillId = `custom_${customSkills.indexOf(skillName)}`
    const currentSkills = formData.skills || []
    setCustomSkills(customSkills.filter(s => s !== skillName))
    updateFormData({
      skills: currentSkills.filter(id => !id.includes(skillName.toLowerCase().replace(/\s+/g, '_')))
    })
  }

  const addTag = (tag?: string) => {
    const tagToAdd = tag || newTag.trim()
    const currentTags = formData.tags || []
    if (tagToAdd && !currentTags.includes(tagToAdd) && currentTags.length < 5) {
      updateFormData({
        tags: [...currentTags, tagToAdd]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = formData.tags || []
    updateFormData({
      tags: currentTags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-6">
      {/* Service Title */}
      <div>
        <Label htmlFor="title">Service Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="I will design a professional logo for your business"
          maxLength={200}
          className="text-base"
        />
        <p className="text-sm text-gray-500 mt-1">
          {(formData.title || '').length}/200 characters
        </p>
        <p className="text-xs text-gray-400 mt-1">
          💡 As your Gig storefront, your title is the most important place to include keywords that buyers would likely use to search for a service like yours.
        </p>
      </div>

      {/* Short Description */}
      <div>
        <Label htmlFor="shortDescription">Short Description</Label>
        <Input
          id="shortDescription"
          value={formData.shortDescription}
          onChange={(e) => updateFormData({ shortDescription: e.target.value })}
          placeholder="Brief one-line description of your service"
          maxLength={300}
        />
        <p className="text-sm text-gray-500 mt-1">
          Optional. {formData.shortDescription?.length || 0}/300 characters
        </p>
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <p className="text-sm text-gray-600 mb-3">
          Choose the category and sub-category most suitable for your Gig.
        </p>

        {/* Suggested Categories */}
        {suggestedCategories.length > 0 && !formData.categoryId && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              💡 Suggested categories based on your title:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    updateFormData({
                      categoryId: cat.id,
                      skills: []
                    })
                    setSuggestedCategories([])
                  }}
                  className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 hover:border-blue-400 transition-colors"
                >
                  {cat.name} →
                </button>
              ))}
            </div>
          </div>
        )}

        <Select
          value={formData.categoryId}
          onValueChange={(value) => {
            updateFormData({
              categoryId: value,
              skills: []
            })
            setSuggestedCategories([])
          }}
        >
          <SelectTrigger className="w-full text-base">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Show selected category info */}
        {formData.categoryId && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected:</span>{' '}
              {categories.find(c => c.id === formData.categoryId)?.name}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Service Description *</Label>
        <p className="text-sm text-gray-600 mb-3">
          Briefly describe your Gig. Include the most important information for your Gig.
        </p>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Describe your service in detail. What will you deliver? What's included? What makes your service unique?"
          rows={10}
          maxLength={5000}
          className="text-base resize-none"
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-500">
            {(formData.description || '').length}/5000 characters
          </p>
          {(formData.description || '').length < 50 && (formData.description || '').length > 0 && (
            <p className="text-sm text-orange-600">
              At least {50 - (formData.description || '').length} more characters needed
            </p>
          )}
          {(formData.description || '').length >= 50 && (
            <p className="text-sm text-green-600">
              ✓ Minimum length met
            </p>
          )}
        </div>
      </div>

      {/* Skills */}
      {formData.categoryId && (
        <div>
          <Label>Skills *</Label>
          <p className="text-sm text-gray-600 mb-3">
            Select skills that best describe your service, or add your own
          </p>

          {/* Predefined Skills */}
          {filteredSkills.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {filteredSkills.map((skill) => (
                <label
                  key={skill.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.skills.includes(skill.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill.id)}
                    onChange={() => handleSkillToggle(skill.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{skill.name}</span>
                </label>
              ))}
            </div>
          )}

          {/* Custom Skills */}
          {customSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <p className="w-full text-sm font-medium text-gray-700 mb-2">Your custom skills:</p>
              {customSkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeCustomSkill(skill)}
                    className="ml-2 text-purple-600 hover:text-purple-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Custom Skill */}
          <div className="border-t pt-4">
            <Label htmlFor="customSkill">Add Custom Skill</Label>
            <p className="text-sm text-gray-600 mb-3">
              Don't see your skill listed? Add it here
            </p>
            <div className="flex gap-2">
              <Input
                id="customSkill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
                placeholder="e.g., Laravel, WordPress, Vue.js"
                maxLength={50}
                disabled={customSkills.length + formData.skills.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCustomSkill}
                disabled={!newSkill.trim() || customSkills.length + formData.skills.length >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formData.skills.length + customSkills.length}/10 skills maximum
            </p>
          </div>

          {filteredSkills.length === 0 && customSkills.length === 0 && (
            <p className="text-gray-500 text-sm mt-4">Select from the list above or add your own custom skills</p>
          )}
        </div>
      )}

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Search Tags</Label>
        <p className="text-sm text-gray-600 mb-3">
          Tag your Gig with buzz words that are relevant to the services you offer. Use all 5 tags to get found.
        </p>

        {/* Popular Tags Suggestions */}
        {formData.categoryId && (formData.tags || []).length < 5 && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">
              💡 Popular tags in {categories.find(c => c.id === formData.categoryId)?.name}:
            </p>
            <div className="flex flex-wrap gap-2">
              {getPopularTags()
                .filter(tag => !(formData.tags || []).includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={(formData.tags || []).length >= 5}
                    className="px-3 py-1.5 text-sm bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-100 hover:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + {tag}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Current Tags */}
        {(formData.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {(formData.tags || []).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add Tag Input */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a tag"
            maxLength={50}
            disabled={(formData.tags || []).length >= 5}
            className="text-base"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag()}
            disabled={!newTag.trim() || (formData.tags || []).includes(newTag.trim()) || (formData.tags || []).length >= 5}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {(formData.tags || []).length}/5 tags maximum. Use letters and numbers only.
        </p>
        {(formData.tags || []).length >= 5 && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ You've reached the maximum of 5 tags
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <span className="text-xl mr-2">💡</span>
          Tips for Creating a Stand-Out Gig
        </h3>
        <ul className="text-sm text-blue-900 space-y-2">
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            <span>Use a clear, keyword-rich title that explains exactly what you'll deliver</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            <span>Choose the most accurate category to help buyers find your service</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            <span>Write a detailed description highlighting your unique value and process</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            <span>Use all 5 search tags with relevant, searchable keywords</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-blue-600">✓</span>
            <span>Select skills that accurately represent your expertise</span>
          </li>
        </ul>
      </div>
    </div>
  )
}