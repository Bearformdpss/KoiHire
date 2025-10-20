'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, Flag, Filter, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { reviewsApi } from '@/lib/api/reviews'

interface Review {
  id: string
  rating: number
  comment: string
  communication: number
  quality: number
  timeliness: number
  professionalism: number
  reviewer: {
    id?: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
  project?: {
    id?: string
    title: string
  }
  createdAt: string
  helpful: number
  isHelpful?: boolean
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  categoryAverages: {
    communication: number
    quality: number
    timeliness: number
    professionalism: number
  }
}

interface ReviewDisplayProps {
  userId: string
  showStats?: boolean
  limit?: number
  profileReviews?: Review[]
}

export function ReviewDisplay({ userId, showStats = true, limit, profileReviews }: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')

  useEffect(() => {
    fetchReviews()
  }, [userId, filter, sortBy])

  // Separate effect for profileReviews changes
  useEffect(() => {
    if (profileReviews) {
      fetchReviews()
    }
  }, [profileReviews])

  const fetchReviews = async () => {
    try {
      // Always fetch stats from API for rating breakdown
      const statsResponse = await reviewsApi.getUserReviewStats(userId)
      
      let reviewsToUse = []
      
      if (profileReviews) {
        // Use provided profile reviews
        reviewsToUse = profileReviews
      } else {
        // Fallback to API fetch
        const reviewsResponse = await reviewsApi.getUserReviews(userId, { type: 'RECEIVED' })
        reviewsToUse = reviewsResponse.success ? reviewsResponse.reviews : []
      }
      
      if (reviewsToUse.length > 0 || (statsResponse.success && statsResponse.stats.totalReviews > 0)) {
        let filteredReviews = [...reviewsToUse]
        
        if (filter !== 'ALL') {
          const filterRating = parseInt(filter)
          filteredReviews = filteredReviews.filter(review => review.rating === filterRating)
        }

        // Sort reviews
        filteredReviews.sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case 'oldest':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            case 'highest':
              return b.rating - a.rating
            case 'lowest':
              return a.rating - b.rating
            default:
              return 0
          }
        })

        if (limit) {
          filteredReviews = filteredReviews.slice(0, limit)
        }

        setReviews(filteredReviews);
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        } else {
          // Calculate stats from available reviews if API fails
          const totalReviews = reviewsToUse.length
          const averageRating = totalReviews > 0 
            ? reviewsToUse.reduce((sum: number, r: Review) => sum + r.rating, 0) / totalReviews 
            : 0
          
          const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          reviewsToUse.forEach((r: Review) => {
            if (r.rating >= 1 && r.rating <= 5) {
              ratingDistribution[r.rating as keyof typeof ratingDistribution]++
            }
          })
          
          setStats({
            averageRating,
            totalReviews,
            ratingDistribution,
            categoryAverages: {
              communication: totalReviews > 0 ? reviewsToUse.reduce((sum: number, r: Review) => sum + (r.communication || r.rating), 0) / totalReviews : 0,
              quality: totalReviews > 0 ? reviewsToUse.reduce((sum: number, r: Review) => sum + (r.quality || r.rating), 0) / totalReviews : 0,
              timeliness: totalReviews > 0 ? reviewsToUse.reduce((sum: number, r: Review) => sum + (r.timeliness || r.rating), 0) / totalReviews : 0,
              professionalism: totalReviews > 0 ? reviewsToUse.reduce((sum: number, r: Review) => sum + (r.professionalism || r.rating), 0) / totalReviews : 0
            }
          })
        }
      } else {
        // No reviews available
        setReviews([]);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          categoryAverages: { communication: 0, quality: 0, timeliness: 0, professionalism: 0 }
        });
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      // Mock API call - replace with actual implementation
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              helpful: review.isHelpful ? review.helpful - 1 : review.helpful + 1,
              isHelpful: !review.isHelpful 
            }
          : review
      ));
    } catch (error) {
      console.error('Failed to update helpful status:', error);
    }
  }

  const renderStars = (rating: number, size = 'w-4 h-4') => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const renderRatingBar = (rating: number, count: number, total: number) => (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600 w-6">{rating}</span>
      {renderStars(rating)}
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-yellow-400 h-2 rounded-full" 
          style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 w-8">{count}</span>
    </div>
  )

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-lg h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showStats && stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-gray-900">{stats.averageRating}</span>
                <div>
                  {renderStars(Math.round(stats.averageRating), 'w-6 h-6')}
                  <p className="text-sm text-gray-600 mt-1">
                    Based on {stats.totalReviews} reviews
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating}>
                    {renderRatingBar(
                      rating, 
                      stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution], 
                      stats.totalReviews
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Category Averages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Communication</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.round(stats.categoryAverages.communication))}
                    <span className="text-sm font-medium">{stats.categoryAverages.communication}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality of Work</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.round(stats.categoryAverages.quality))}
                    <span className="text-sm font-medium">{stats.categoryAverages.quality}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Timeliness</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.round(stats.categoryAverages.timeliness))}
                    <span className="text-sm font-medium">{stats.categoryAverages.timeliness}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Professionalism</span>
                  <div className="flex items-center space-x-2">
                    {renderStars(Math.round(stats.categoryAverages.professionalism))}
                    <span className="text-sm font-medium">{stats.categoryAverages.professionalism}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Reviews</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
          
          <span className="text-sm text-gray-600">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600">
              Reviews from completed projects will appear here
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {review.reviewer.username?.charAt(0)?.toUpperCase() || 'U'}{review.reviewer.username?.charAt(1)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {review.reviewer.username || 'unknown'}
                    </h4>
                    {review.project && (
                      <p className="text-sm text-blue-600 mt-1">
                        Project: {review.project.title}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium">{review.rating}/5</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Category Ratings */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Communication</p>
                  {renderStars(review.communication, 'w-3 h-3')}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Quality</p>
                  {renderStars(review.quality, 'w-3 h-3')}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Timeliness</p>
                  {renderStars(review.timeliness, 'w-3 h-3')}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Professional</p>
                  {renderStars(review.professionalism, 'w-3 h-3')}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHelpfulClick(review.id)}
                  className={review.isHelpful ? 'text-blue-600' : 'text-gray-600'}
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
                
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Flag className="w-4 h-4 mr-1" />
                  Report
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}