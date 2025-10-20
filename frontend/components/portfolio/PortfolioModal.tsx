'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  User,
  Star,
  ExternalLink,
  Github,
  Calendar,
  Tag,
  MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Portfolio, formatPortfolioCategory, getCategoryColor } from '@/lib/api/portfolios'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface PortfolioModalProps {
  isOpen: boolean
  portfolio: Portfolio | null
  currentImageIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onImageClick?: (index: number) => void
}

export function PortfolioModal({
  isOpen,
  portfolio,
  currentImageIndex,
  onClose,
  onPrevious,
  onNext,
  onImageClick
}: PortfolioModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  // Helper function to get all images (thumbnail + additional images)
  const getAllImages = (portfolio: Portfolio): string[] => {
    const allImages: string[] = []
    
    // Add thumbnail first if it exists
    if (portfolio.thumbnail) {
      allImages.push(portfolio.thumbnail)
    }
    
    // Add additional images, but avoid duplicates
    portfolio.images.forEach(image => {
      if (!allImages.includes(image)) {
        allImages.push(image)
      }
    })
    
    return allImages
  }

  if (!isOpen || !portfolio) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const allImages = getAllImages(portfolio)
  const hasMultipleImages = allImages.length > 1
  const currentImage = allImages[currentImageIndex]

  // Handle contact button click
  const handleContactClick = () => {
    if (!portfolio) return

    if (!isAuthenticated) {
      // Store contact intent and redirect to register
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingContact', JSON.stringify({
          freelancerId: portfolio.user.id,
          freelancerName: `${portfolio.user.firstName} ${portfolio.user.lastName}`,
          portfolioId: portfolio.id,
          portfolioTitle: portfolio.title
        }))
      }
      router.push('/register?intent=contact')
      return
    }

    // Don't allow users to contact themselves
    if (user?.id === portfolio.user.id) {
      // Show a friendly message instead of silently doing nothing
      toast.error("You can't contact yourself! 😄");
      return
    }

    // Redirect to messages with portfolio contact context
    router.push(`/messages?contact=${portfolio.user.id}&portfolio=${portfolio.id}`)
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl mx-4 max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* User Avatar */}
            <div className="relative w-10 h-10">
              {portfolio.user.avatar ? (
                <img
                  src={portfolio.user.avatar}
                  alt={portfolio.user.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div>
              <p className="text-sm text-gray-600">
                Made by{' '}
                <Link 
                  href={`/profile/${portfolio.user.username}`}
                  className="font-medium text-gray-900 hover:text-blue-600"
                >
                  {portfolio.user.firstName} {portfolio.user.lastName}
                </Link>
              </p>
              {portfolio.user.rating && (
                <div className="flex items-center mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-xs text-gray-600">{portfolio.user.rating.toFixed(1)}</span>
                  {portfolio.user.isVerified && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">Verified</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation and Close */}
          <div className="flex items-center space-x-2">
            {hasMultipleImages && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <button
                  onClick={onPrevious}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  disabled={!hasMultipleImages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 bg-gray-100 rounded-full">
                  {currentImageIndex + 1} of {allImages.length}
                </span>
                
                <button
                  onClick={onNext}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  disabled={!hasMultipleImages}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Show contact button for all portfolios except own (checked in handler) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleContactClick}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact
            </Button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-140px)]">
          {/* Left Side - Image */}
          <div className="flex-1 relative bg-gray-50 flex items-center justify-center min-h-[400px] lg:min-h-[500px]">
            {currentImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={currentImage}
                  alt={`${portfolio.title} - Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
                
                {/* Navigation Arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={onPrevious}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={onNext}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="text-gray-400">No image available</div>
            )}
          </div>

          {/* Right Side - Details */}
          <div className="w-full lg:w-80 p-6 overflow-y-auto">
            {/* Title and Category */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(portfolio.category)}`}>
                  {formatPortfolioCategory(portfolio.category)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {portfolio.title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {portfolio.description}
              </p>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              {/* Technologies */}
              {portfolio.technologies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {portfolio.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              {portfolio.duration && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Duration
                  </h4>
                  <p className="text-sm text-gray-600">{portfolio.duration}</p>
                </div>
              )}

              {/* Client */}
              {portfolio.clientName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Client</h4>
                  <p className="text-sm text-gray-600">{portfolio.clientName}</p>
                </div>
              )}

              {/* Links */}
              <div className="space-y-2">
                {portfolio.liveUrl && (
                  <a
                    href={portfolio.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Live Project
                  </a>
                )}
                {portfolio.codeUrl && (
                  <a
                    href={portfolio.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-700"
                  >
                    <Github className="w-4 h-4 mr-1" />
                    View Source Code
                  </a>
                )}
              </div>
            </div>

            {/* Image Thumbnails */}
            {hasMultipleImages && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  All Images ({allImages.length})
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => onImageClick?.(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}