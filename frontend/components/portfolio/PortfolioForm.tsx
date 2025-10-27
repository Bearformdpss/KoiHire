'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, ExternalLink, Github, Calendar, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SingleImageUpload } from '@/components/ui/SingleImageUpload'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { 
  Portfolio, 
  PortfolioCategory, 
  CreatePortfolioData, 
  UpdatePortfolioData,
  portfoliosApi,
  formatPortfolioCategory 
} from '@/lib/api/portfolios'
import toast from 'react-hot-toast'

interface PortfolioFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio?: Portfolio | null
  onSuccess?: (portfolio: Portfolio) => void
}

export function PortfolioForm({ open, onOpenChange, portfolio, onSuccess }: PortfolioFormProps) {
  const [formData, setFormData] = useState<CreatePortfolioData>({
    title: '',
    description: '',
    category: PortfolioCategory.OTHER,
    thumbnail: '',
    images: [],
    technologies: [],
    duration: '',
    clientName: '',
    completedAt: new Date().toISOString(), // Still needed for backend but hidden from form
    isPublic: true
  })

  const [newTechnology, setNewTechnology] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!portfolio

  // Reset form when dialog opens/closes or portfolio changes
  useEffect(() => {
    if (open) {
      if (portfolio) {
        setFormData({
          title: portfolio.title,
          description: portfolio.description,
          category: portfolio.category,
          thumbnail: portfolio.thumbnail || '',
          images: [...portfolio.images],
          technologies: [...portfolio.technologies],
          duration: portfolio.duration || '',
          clientName: portfolio.clientName || '',
          completedAt: portfolio.completedAt,
          isPublic: portfolio.isPublic
        })
      } else {
        setFormData({
          title: '',
          description: '',
          category: PortfolioCategory.OTHER,
          thumbnail: '',
          images: [],
          technologies: [],
          duration: '',
          clientName: '',
          completedAt: new Date().toISOString(),
          isPublic: true
        })
      }
      setErrors({})
    }
  }, [open, portfolio])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }


    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const data: CreatePortfolioData | UpdatePortfolioData = {
        ...formData,
        completedAt: new Date().toISOString() // Auto-set to current date
      }

      let result
      if (isEditing && portfolio) {
        result = await portfoliosApi.updatePortfolio(portfolio.id, data)
      } else {
        result = await portfoliosApi.createPortfolio(data as CreatePortfolioData)
      }

      if (result.success) {
        toast.success(`Portfolio ${isEditing ? 'updated' : 'created'} successfully!`)
        onSuccess?.(result.portfolio)
        onOpenChange(false)
      } else {
        toast.error(`Failed to ${isEditing ? 'update' : 'create'} portfolio`)
      }
    } catch (error) {
      console.error('Error submitting portfolio:', error)
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} portfolio`)
    } finally {
      setLoading(false)
    }
  }

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }))
      setNewTechnology('')
    }
  }

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Portfolio' : 'Add New Portfolio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edit your existing portfolio project details' : 'Create a new portfolio project with title, description, images, and technologies'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. E-commerce Website for Fashion Brand"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project, challenges solved, and key features..."
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as PortfolioCategory }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PortfolioCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatPortfolioCategory(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* Duration and Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Project Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g. 2 weeks, 1 month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name (Optional)</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Client or company name"
              />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail Image</Label>
            <SingleImageUpload
              value={formData.thumbnail}
              onChange={(url) => setFormData(prev => ({ ...prev, thumbnail: url }))}
              endpoint="portfolio-thumbnail-s3"
              className=""
            />
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label>Technologies Used</Label>
            <div className="flex gap-2">
              <Input
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                placeholder="e.g. React, Node.js, MongoDB"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              />
              <Button type="button" onClick={addTechnology} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio Images */}
          <div className="space-y-2">
            <Label>Portfolio Images</Label>
            <ImageUpload
              value={formData.images}
              onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
              maxImages={5}
              endpoint="portfolio-images-s3"
              className=""
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Portfolio' : 'Create Portfolio')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}