'use client'

import React from 'react'
import { Star, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ServiceCardProps {
  id: string
  title: string
  coverImage?: string
  basePrice: number
  rating?: number
  reviewCount?: number
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
  }
  category?: {
    name: string
  }
}

export function ServiceCard({
  id,
  title,
  coverImage,
  basePrice,
  rating,
  reviewCount = 0,
  freelancer,
  category
}: ServiceCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/services/${id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex-shrink-0 w-[280px] bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
    >
      {/* Service Image */}
      <div className="relative h-[180px] bg-gray-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-koi-teal/20 to-koi-orange/20">
            <span className="text-4xl text-koi-navy/20">📦</span>
          </div>
        )}
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            // TODO: Implement favorite functionality
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 hover:fill-red-500 transition-colors" />
        </button>
      </div>

      {/* Service Info */}
      <div className="p-4">
        {/* Freelancer Info */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {freelancer.avatar ? (
              <img
                src={freelancer.avatar}
                alt={freelancer.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-koi-teal to-koi-orange" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">
            {freelancer.firstName} {freelancer.lastName}
          </span>
        </div>

        {/* Service Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-3 h-10">
          {title}
        </h3>

        {/* Rating and Price */}
        <div className="flex items-center justify-between">
          {/* Rating */}
          {rating && rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-gray-900">
                {rating.toFixed(1)}
              </span>
              {reviewCount > 0 && (
                <span className="text-xs text-gray-500">({reviewCount})</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}

          {/* Price */}
          <div className="text-right">
            <div className="text-xs text-gray-500">Starting at</div>
            <div className="text-sm font-bold text-gray-900">
              ${basePrice.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Category Tag (optional) */}
        {category && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{category.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
