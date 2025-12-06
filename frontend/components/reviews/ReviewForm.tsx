'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { reviewsApi } from '@/lib/api/reviews'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  projectId: string
  revieweeId: string
  revieweeName: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface ReviewData {
  rating: number
  comment: string
  communication: number
  quality: number
  timeliness: number
  professionalism: number
}

export function ReviewForm({ 
  projectId, 
  revieweeId, 
  revieweeName, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuthStore()
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    comment: '',
    communication: 0,
    quality: 0,
    timeliness: 0,
    professionalism: 0
  })
  const [submitting, setSubmitting] = useState(false)

  const handleStarClick = (field: keyof ReviewData, rating: number) => {
    if (field === 'comment') return
    setReviewData(prev => ({
      ...prev,
      [field]: rating
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (reviewData.rating === 0) {
      toast.error('Please provide an overall rating')
      return
    }
    
    if (!reviewData.comment.trim()) {
      toast.error('Please provide a comment')
      return
    }

    if (reviewData.communication === 0 || reviewData.quality === 0 || 
        reviewData.timeliness === 0 || reviewData.professionalism === 0) {
      toast.error('Please rate all categories')
      return
    }

    setSubmitting(true)
    try {
      const response = await reviewsApi.createReview({
        projectId,
        revieweeId,
        ...reviewData
      })
      
      if (response.success) {
        toast.success('Review submitted successfully!')
        onSuccess?.()
      } else {
        toast.error('Failed to submit review')
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStarRating = (
    label: string, 
    field: keyof ReviewData, 
    value: number,
    description?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {description && <span className="text-gray-500 text-xs ml-1">({description})</span>}
      </label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(field, star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Leave a Review for {revieweeName}
        </h3>
        <p className="text-gray-600 text-sm">
          Help other users by sharing your experience working together
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          {renderStarRating('Overall Rating', 'rating', reviewData.rating)}
        </div>

        {/* Detailed Ratings */}
        <div className="grid md:grid-cols-2 gap-6">
          {renderStarRating(
            'Communication', 
            'communication', 
            reviewData.communication,
            'Responsiveness and clarity'
          )}
          {renderStarRating(
            'Quality of Work', 
            'quality', 
            reviewData.quality,
            'Meets expectations and requirements'
          )}
          {renderStarRating(
            'Timeliness', 
            'timeliness', 
            reviewData.timeliness,
            'Meets deadlines and schedules'
          )}
          {renderStarRating(
            'Professionalism', 
            'professionalism', 
            reviewData.professionalism,
            'Professional conduct and attitude'
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Comment
          </label>
          <textarea
            value={reviewData.comment}
            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your experience working with this person..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              Be honest and constructive in your feedback
            </span>
            <span className="text-xs text-gray-500">
              {reviewData.comment.length}/1000
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}