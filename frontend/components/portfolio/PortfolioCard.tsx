'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Eye, 
  User,
  Star,
  Briefcase,
  Camera
} from 'lucide-react'
import { Portfolio, formatPortfolioCategory, getCategoryColor } from '@/lib/api/portfolios'

interface PortfolioCardProps {
  portfolio: Portfolio
  showUser?: boolean
  className?: string
  onPortfolioClick?: (portfolio: Portfolio, imageIndex?: number) => void
}

export function PortfolioCard({ portfolio, showUser = true, className = '', onPortfolioClick }: PortfolioCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getThumbnailUrl = () => {
    if (portfolio.thumbnail) {
      return portfolio.thumbnail
    }
    if (portfolio.images && portfolio.images.length > 0) {
      return portfolio.images[0]
    }
    return null
  }

  const handleImageClick = () => {
    if (onPortfolioClick) {
      onPortfolioClick(portfolio, 0)
    }
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    if (onPortfolioClick) {
      e.preventDefault()
      onPortfolioClick(portfolio, 0)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-100 group">
        <div 
          className="w-full h-full cursor-pointer"
          onClick={handleImageClick}
        >
          {getThumbnailUrl() ? (
            <img
              src={getThumbnailUrl()!}
              alt={portfolio.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Briefcase className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(portfolio.category)}`}>
            {formatPortfolioCategory(portfolio.category)}
          </span>
        </div>

        {/* Image Count Badge */}
        {portfolio.images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
            <Camera className="w-3 h-3 mr-1" />
            {portfolio.images.length}
          </div>
        )}

        {/* View Count - moved to bottom right */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center">
          <Eye className="w-3 h-3 mr-1" />
          {portfolio.views}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-sm font-medium bg-black bg-opacity-60 px-3 py-1 rounded-full">
            View Portfolio
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        {showUser && (
          <div className="flex items-center mb-3">
            <div className="relative w-6 h-6 mr-2">
              {portfolio.user.avatar ? (
                <img
                  src={portfolio.user.avatar}
                  alt={portfolio.user.firstName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${portfolio.user.username}`}>
                <p className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate">
                  {portfolio.user.firstName} {portfolio.user.lastName}
                </p>
              </Link>
              {portfolio.user.rating && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">{portfolio.user.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Title */}
        {onPortfolioClick ? (
          <h3 
            className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2 cursor-pointer"
            onClick={handleTitleClick}
          >
            {portfolio.title}
          </h3>
        ) : (
          <Link href={`/portfolio/${portfolio.id}`}>
            <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2 cursor-pointer">
              {portfolio.title}
            </h3>
          </Link>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {portfolio.description}
        </p>

        {/* Technologies */}
        {portfolio.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {portfolio.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tech}
              </span>
            ))}
            {portfolio.technologies.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{portfolio.technologies.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        {portfolio.duration && (
          <div className="text-xs text-gray-500">
            <span className="text-gray-400">Duration:</span> {portfolio.duration}
          </div>
        )}

        {/* Client Name */}
        {portfolio.clientName && (
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-gray-400">Client:</span> {portfolio.clientName}
          </div>
        )}
      </div>
    </div>
  )
}