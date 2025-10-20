'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HorizontalScrollCarouselProps {
  children: React.ReactNode
  title?: string
  viewAllLink?: string
  viewAllText?: string
  onViewAll?: () => void
  className?: string
  showArrows?: boolean
}

export function HorizontalScrollCarousel({
  children,
  title,
  viewAllLink,
  viewAllText = 'View All',
  onViewAll,
  className = '',
  showArrows = true
}: HorizontalScrollCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [children])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-koi-navy">{title}</h2>
          {(viewAllLink || onViewAll) && (
            <button
              onClick={onViewAll}
              className="text-sm font-medium text-koi-orange hover:text-koi-orange/80 transition-colors"
            >
              {viewAllText} →
            </button>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {showArrows && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {children}
        </div>

        {/* Right Arrow */}
        {showArrows && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
