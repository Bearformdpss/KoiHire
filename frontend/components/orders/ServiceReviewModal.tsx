'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2, Star, Send } from 'lucide-react'
import { serviceOrdersApi } from '@/lib/api/service-orders'
import toast from 'react-hot-toast'

interface ServiceReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: () => Promise<void>
  freelancerId: string
  freelancerName: string
  serviceOrderId: string
}

interface ReviewData {
  rating: number
  comment: string
  communication: number
  quality: number
  delivery: number
  value: number
}

export function ServiceReviewModal({
  isOpen,
  onClose,
  onApprove,
  freelancerId,
  freelancerName,
  serviceOrderId
}: ServiceReviewModalProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    comment: '',
    communication: 0,
    quality: 0,
    delivery: 0,
    value: 0
  })
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false)
  const [approving, setApproving] = useState(false)

  if (!isOpen) return null

  const handleStarClick = (field: keyof ReviewData, rating: number) => {
    if (field === 'comment') return
    setReviewData(prev => ({
      ...prev,
      [field]: rating
    }))
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
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
        reviewData.delivery === 0 || reviewData.value === 0) {
      toast.error('Please rate all categories')
      return
    }

    setSubmitting(true)
    try {
      const response = await serviceOrdersApi.submitReview(serviceOrderId, {
        rating: reviewData.rating,
        comment: reviewData.comment,
        communication: reviewData.communication,
        quality: reviewData.quality,
        delivery: reviewData.delivery,
        value: reviewData.value
      })

      if (response.data?.success) {
        setHasSubmittedReview(true)
        toast.success('Review submitted successfully! Now click "Approve & Release Payment" to finalize.')
      } else {
        toast.error(response.data?.message || 'Failed to submit review')
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error)
      toast.error(error.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveClick = async () => {
    // If review was already submitted, proceed directly to approval
    if (hasSubmittedReview) {
      setApproving(true)
      try {
        await onApprove()
        onClose()
      } catch (error) {
        // Error handling is done in parent
      } finally {
        setApproving(false)
      }
      return
    }

    // Otherwise, confirm they want to skip
    const confirmed = window.confirm(
      'Are you sure you want to skip leaving a review? This is a great opportunity to help other clients find quality freelancers.'
    )
    if (confirmed) {
      setApproving(true)
      try {
        await onApprove()
        onClose()
      } catch (error) {
        // Error handling is done in parent
      } finally {
        setApproving(false)
      }
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
            disabled={hasSubmittedReview}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-200'
              } ${hasSubmittedReview ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Leave a Review</h2>
              <p className="text-gray-600 text-sm mt-1">
                Help other clients by sharing your experience with {freelancerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={approving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmitReview} className="space-y-6">
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
                'Delivery',
                'delivery',
                reviewData.delivery,
                'Timeliness and delivery speed'
              )}
              {renderStarRating(
                'Value for Money',
                'value',
                reviewData.value,
                'Worth the price paid'
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
                disabled={hasSubmittedReview}
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

            {/* Submit Review Button */}
            {!hasSubmittedReview && (
              <div className="flex items-center justify-end">
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
            )}
          </form>

          {/* Approve & Release Payment Section */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Ready to finalize and release payment to the freelancer?
            </p>
            <Button
              onClick={handleApproveClick}
              disabled={approving}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving & Releasing Payment...
                </>
              ) : (
                <>
                  {hasSubmittedReview ? 'Approve & Release Payment' : 'Skip Review & Approve'}
                </>
              )}
            </Button>
            {!hasSubmittedReview && (
              <p className="text-xs text-gray-500 mt-2">
                You can leave a review later if you prefer
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
