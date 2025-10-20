'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  coverImage?: string
  galleryImages?: string[]
  videoUrl?: string
  serviceTitle: string
  onImageClick?: (index: number) => void
}

export function ImageCarousel({
  coverImage,
  galleryImages = [],
  videoUrl,
  serviceTitle,
  onImageClick
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Combine all media items
  const allImages = coverImage ? [coverImage, ...galleryImages] : galleryImages
  const totalImages = allImages.length

  if (totalImages === 0 && !videoUrl) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    )
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index)
  }

  const currentImage = allImages[currentIndex]

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden group">
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt={`${serviceTitle} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => onImageClick?.(currentIndex)}
            />

            {/* Navigation Arrows */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {totalImages > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {totalImages}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Thumbnail Strip */}
      {(totalImages > 1 || videoUrl) && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                currentIndex === index
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}

          {/* Video Thumbnail */}
          {videoUrl && (
            <button
              className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 bg-gray-900 flex items-center justify-center transition-all"
              onClick={() => {
                // TODO: Implement video modal
                console.log('Play video:', videoUrl)
              }}
            >
              <Play className="w-8 h-8 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
