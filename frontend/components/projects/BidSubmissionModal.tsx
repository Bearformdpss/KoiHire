'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, DollarSign, Clock, FileText, Send } from 'lucide-react'
import { applicationsApi } from '@/lib/api/applications'
import { messagesApi } from '@/lib/api/messages'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  client: {
    id: string
    username: string
    rating: number
  }
  category: {
    name: string
  }
  skills: Array<{
    skill: {
      name: string
    }
  }>
}

interface BidSubmissionModalProps {
  project: Project
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BidSubmissionModal({ project, isOpen, onClose, onSuccess }: BidSubmissionModalProps) {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedBudget: '',
    timeline: '',
    initialMessage: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.coverLetter || formData.coverLetter.length < 20) {
      newErrors.coverLetter = 'Cover letter must be at least 20 characters'
    }

    if (formData.proposedBudget) {
      const budget = Number(formData.proposedBudget)
      if (isNaN(budget) || budget <= 0) {
        newErrors.proposedBudget = 'Please enter a valid budget'
      } else if (budget < project.minBudget || budget > project.maxBudget) {
        newErrors.proposedBudget = `Budget must be between $${project.minBudget} and $${project.maxBudget}`
      }
    }

    if (!formData.timeline || formData.timeline.length < 5) {
      newErrors.timeline = 'Please provide a timeline'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const applicationData = {
        coverLetter: formData.coverLetter,
        proposedBudget: formData.proposedBudget ? Number(formData.proposedBudget) : undefined,
        timeline: formData.timeline
      }

      const response = await applicationsApi.submitApplication(project.id, applicationData)
      
      if (response.success) {
        // If there's an initial message, create conversation and send it
        if (formData.initialMessage.trim()) {
          try {
            // Create conversation between freelancer (current user) and client
            // Pass current user ID as participant for bid conversation
            const conversationResponse = await messagesApi.createConversation(project.id, user?.id)
            if (conversationResponse.success && conversationResponse.conversation) {
              await messagesApi.sendMessage(conversationResponse.conversation.id, {
                content: formData.initialMessage.trim(),
                type: 'TEXT'
              })
              toast.success('Application submitted and conversation started!')
            } else {
              toast.success('Application submitted successfully! (Note: Could not start conversation)')
            }
          } catch (messageError) {
            console.error('Failed to create conversation or send message:', messageError)
            toast.success('Application submitted successfully! (Note: Could not start conversation)')
          }
        } else {
          toast.success('Application submitted successfully!')
        }
        
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          coverLetter: '',
          proposedBudget: '',
          timeline: '',
          initialMessage: ''
        })
      }
    } catch (error: any) {
      console.error('Failed to submit application:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to submit application')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Submit Your Proposal</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Budget:</span> ${project.minBudget} - ${project.maxBudget}
            </div>
            <div>
              <span className="font-medium">Timeline:</span> {project.timeline}
            </div>
            <div>
              <span className="font-medium">Category:</span> {project.category.name}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {project.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {skill.skill.name}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Cover Letter *
            </label>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
              placeholder="Introduce yourself and explain why you're the perfect fit for this project. What's your approach? What makes you qualified?"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={2000}
            />
            {errors.coverLetter && <p className="text-red-600 text-sm mt-1">{errors.coverLetter}</p>}
            <p className="text-gray-500 text-sm mt-1">{formData.coverLetter.length}/2000 characters</p>
          </div>

          {/* Proposed Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Your Proposed Budget (USD) - Optional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={formData.proposedBudget}
                onChange={(e) => setFormData(prev => ({ ...prev, proposedBudget: e.target.value }))}
                placeholder={`Between ${project.minBudget} and ${project.maxBudget}`}
                min={project.minBudget}
                max={project.maxBudget}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {errors.proposedBudget && <p className="text-red-600 text-sm mt-1">{errors.proposedBudget}</p>}
            <p className="text-gray-500 text-sm mt-1">
              Leave empty to discuss budget with the client
            </p>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Your Timeline *
            </label>
            <input
              type="text"
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
              placeholder="e.g. 2 weeks, 1 month, can start immediately"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
            {errors.timeline && <p className="text-red-600 text-sm mt-1">{errors.timeline}</p>}
          </div>

          {/* Initial Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Start a conversation (Optional)
            </label>
            <textarea
              value={formData.initialMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, initialMessage: e.target.value }))}
              placeholder="Have specific questions about the project? Want to clarify requirements? Start the conversation here..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
            <p className="text-gray-500 text-sm mt-1">
              {formData.initialMessage ? `${formData.initialMessage.length}/500 characters` : 'This will create a private conversation with the client'}
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips for a winning proposal:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about your approach and methodology</li>
              <li>• Highlight relevant experience and skills</li>
              <li>• Ask clarifying questions if needed</li>
              <li>• Be realistic with your timeline and budget</li>
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 min-w-32"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Proposal
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}