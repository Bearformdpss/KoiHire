'use client'

import { useState, useEffect } from 'react'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { ReviewDisplay } from '@/components/reviews/ReviewDisplay'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { Button } from '@/components/ui/button'
import { 
  Star, 
  TrendingUp, 
  Calendar, 
  User, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { reviewsApi } from '@/lib/api/reviews'

interface PendingReview {
  id: string
  projectId: string
  projectTitle: string
  revieweeId: string
  revieweeName: string
  revieweeType: 'CLIENT' | 'FREELANCER'
  completedAt: string
  dueDate: string
}

export default function ReviewsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'received' | 'given' | 'pending'>('received')
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      const response = await reviewsApi.getPendingReviews()
      if (response.success) {
        setPendingReviews(response.pendingReviews)
      } else {
        setPendingReviews([])
      }
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error)
      // On error, show empty state
      setPendingReviews([])
    }
  }

  const handleReviewSubmitted = () => {
    setShowReviewForm(false)
    setSelectedReview(null)
    fetchPendingReviews()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysRemaining = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
            <p className="text-gray-600">
              Manage your reviews and see what others say about your work
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Average Rating</h3>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">N/A</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Reviews Received</h3>
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-2">All time</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Reviews Given</h3>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500 mt-2">All time</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Pending Reviews</h3>
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingReviews.length}</p>
              <p className="text-sm text-gray-500 mt-2">Action required</p>
            </div>
          </div>

          {/* Pending Reviews Alert */}
          {pendingReviews.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-orange-800">Pending Reviews</h3>
                  <p className="text-orange-700 text-sm mt-1">
                    You have {pendingReviews.length} completed projects waiting for your review. 
                    Help maintain a trustworthy community by sharing your experience.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setActiveTab('received')
                  setShowReviewForm(false)
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="w-4 h-4 mr-2 inline" />
                Reviews Received
              </button>
              <button
                onClick={() => {
                  setActiveTab('given')
                  setShowReviewForm(false)
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'given'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Reviews Given
              </button>
              <button
                onClick={() => {
                  setActiveTab('pending')
                  setShowReviewForm(false)
                }}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 mr-2 inline" />
                Pending ({pendingReviews.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div>
            {activeTab === 'received' && !showReviewForm && (
              <div>
                <ReviewDisplay userId={user?.id || ''} showStats={true} />
              </div>
            )}

            {activeTab === 'given' && !showReviewForm && (
              <div>
                <div className="text-center py-8 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews You've Given</h3>
                  <p className="text-gray-600">
                    Reviews you've submitted for completed projects
                  </p>
                </div>
                {/* This would show reviews given by the current user */}
                <ReviewDisplay userId={user?.id || ''} showStats={false} />
              </div>
            )}

            {activeTab === 'pending' && !showReviewForm && (
              <div className="space-y-4">
                <div className="text-center py-8 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Reviews</h3>
                  <p className="text-gray-600">
                    Projects that are completed and waiting for your review
                  </p>
                </div>

                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">
                      You don't have any pending reviews at the moment
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingReviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{review.projectTitle}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {review.revieweeType === 'FREELANCER' ? 'Freelancer' : 'Client'}: {review.revieweeName}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Completed: {formatDate(review.completedAt)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Due: {formatDate(review.dueDate)} 
                                ({getDaysRemaining(review.dueDate)} days remaining)
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedReview(review)
                              setShowReviewForm(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Write Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {showReviewForm && selectedReview && (
              <div>
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowReviewForm(false)
                      setSelectedReview(null)
                    }}
                    className="mb-4"
                  >
                    ← Back to Pending Reviews
                  </Button>
                </div>
                <ReviewForm
                  projectId={selectedReview.projectId}
                  revieweeId={selectedReview.revieweeId}
                  revieweeName={selectedReview.revieweeName}
                  onSuccess={handleReviewSubmitted}
                  onCancel={() => {
                    setShowReviewForm(false)
                    setSelectedReview(null)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthRequired>
  )
}