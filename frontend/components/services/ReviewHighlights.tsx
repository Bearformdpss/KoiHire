'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  comment?: string
  client: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  createdAt: string
}

interface ReviewHighlightsProps {
  overallRating: number
  totalReviews: number
  reviews?: Review[]
  onViewAll?: () => void
  className?: string
}

export function ReviewHighlights({
  overallRating,
  totalReviews,
  reviews = [],
  onViewAll,
  className
}: ReviewHighlightsProps) {
  // Calculate star breakdown
  const calculateStarBreakdown = () => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    reviews.forEach(review => {
      const rating = Math.floor(review.rating) as 1 | 2 | 3 | 4 | 5
      if (rating >= 1 && rating <= 5) {
        breakdown[rating]++
      }
    })

    return Object.entries(breakdown)
      .reverse()
      .map(([stars, count]) => ({
        stars: parseInt(stars),
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
      }))
  }

  const starBreakdown = calculateStarBreakdown()
  const topReviews = reviews.slice(0, 3)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago'`
    if (diffDays < 60) return '1 month ago'
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          "w-4 h-4",
          index < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        )}
      />
    ))
  }

  if (totalReviews === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 text-sm">Be the first to review this service!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Reviews ({totalReviews})
          </span>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View all
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating & Star Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Rating */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <div className="text-5xl font-bold text-gray-900 mb-2">
              {overallRating.toFixed(1)}
            </div>
            <div className="flex gap-1 mb-2">
              {renderStars(Math.floor(overallRating))}
            </div>
            <p className="text-sm text-gray-600">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Star Breakdown */}
          <div className="space-y-2">
            {starBreakdown.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-16">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-700">{stars}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Reviews */}
        {topReviews.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900">Recent Reviews</h4>
            {topReviews.map((review) => (
              <div key={review.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {review.client.avatar ? (
                      <img
                        src={review.client.avatar}
                        alt={`${review.client.firstName} ${review.client.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {review.client.firstName} {review.client.lastName}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
