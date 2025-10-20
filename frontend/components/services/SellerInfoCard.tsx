'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Clock, CheckCircle, Calendar, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SellerInfoCardProps {
  freelancer: {
    id: string
    firstName: string
    lastName: string
    username?: string
    avatar?: string
    rating?: number
    totalOrders?: number
    createdAt?: string
  }
  reviewCount: number
  className?: string
}

export function SellerInfoCard({ freelancer, reviewCount, className }: SellerInfoCardProps) {
  const router = useRouter()

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getInitials = () => {
    const first = freelancer.firstName?.[0] || ''
    const last = freelancer.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }

  const handleViewProfile = () => {
    if (freelancer.username) {
      router.push(`/profile/${freelancer.username}`)
    }
  }

  const isTopRated = (freelancer.rating || 0) >= 4.8

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>About the Seller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Avatar & Name */}
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {freelancer.avatar ? (
              <img
                src={freelancer.avatar}
                alt={`${freelancer.firstName} ${freelancer.lastName}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {freelancer.firstName} {freelancer.lastName}
            </h3>
            <p className="text-sm text-gray-600">@{freelancer.username || 'seller'}</p>

            {/* Top Rated Badge */}
            {isTopRated && (
              <Badge className="mt-1 bg-yellow-500 hover:bg-yellow-600 text-white">
                ⭐ Top Rated Seller
              </Badge>
            )}
          </div>
        </div>

        {/* Rating */}
        {freelancer.rating && (
          <div className="flex items-center gap-2 py-2 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-900">{freelancer.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-600">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="space-y-3 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Avg. response time</span>
            </div>
            <span className="font-medium text-gray-900">2 hours</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span>Orders completed</span>
            </div>
            <span className="font-medium text-gray-900">
              {freelancer.totalOrders || 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Member since</span>
            </div>
            <span className="font-medium text-gray-900">
              {formatDate(freelancer.createdAt)}
            </span>
          </div>
        </div>

        {/* View Profile Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleViewProfile}
        >
          <User className="w-4 h-4 mr-2" />
          View Full Profile
        </Button>
      </CardContent>
    </Card>
  )
}
