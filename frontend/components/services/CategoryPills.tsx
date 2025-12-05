'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { categoriesApi } from '@/lib/api/categories'

interface Subcategory {
  id: string
  name: string
  slug: string
  items: string[]
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  subcategories?: Subcategory[]
  _count?: {
    services?: number
  }
}

interface CategoryPillsProps {
  categories: Category[]
  selectedCategoryId?: string | null
  selectedSubcategoryId?: string | null
  onSelectCategory?: (categoryId: string | null) => void
  onSelectSubcategory?: (subcategoryId: string | null) => void
  mode?: 'filter' | 'navigate'
  className?: string
}

export function CategoryPills({
  categories,
  selectedCategoryId = null,
  selectedSubcategoryId = null,
  onSelectCategory,
  onSelectSubcategory,
  mode = 'filter',
  className
}: CategoryPillsProps) {
  const router = useRouter()
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null)
  const [subcategoriesData, setSubcategoriesData] = useState<Map<string, Subcategory[]>>(new Map())
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect touch device
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  // Fetch all subcategories on mount
  useEffect(() => {
    const fetchAllSubcategories = async () => {
      if (categories.length === 0) return

      setLoadingSubcategories(true)
      try {
        const subcategoriesMap = new Map<string, Subcategory[]>()

        // Fetch subcategories for all categories in parallel
        const fetchPromises = categories.map(async (category) => {
          try {
            const response = await categoriesApi.getSubcategories(category.id)
            if (response.success && response.subcategories) {
              subcategoriesMap.set(category.id, response.subcategories)
            }
          } catch (error) {
            console.error(`Failed to fetch subcategories for ${category.name}:`, error)
          }
        })

        await Promise.all(fetchPromises)
        setSubcategoriesData(subcategoriesMap)
      } catch (error) {
        console.error('Failed to fetch subcategories:', error)
      } finally {
        setLoadingSubcategories(false)
      }
    }

    fetchAllSubcategories()
  }, [categories])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setHoveredCategoryId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hover handlers with delays
  const handleMouseEnter = (categoryId: string) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // Set hover with slight delay to prevent flicker
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategoryId(categoryId)
    }, 100)
  }

  const handleMouseLeave = () => {
    // Clear hover timer
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // Close with delay for UX (allows mouse to move to dropdown)
    closeTimeoutRef.current = setTimeout(() => {
      setHoveredCategoryId(null)
    }, 300)
  }

  const handleDropdownMouseEnter = () => {
    // Cancel close when entering dropdown
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const handleCategoryClick = (categoryId: string) => {
    // For touch devices, toggle dropdown
    if (isTouchDevice) {
      setHoveredCategoryId(hoveredCategoryId === categoryId ? null : categoryId)
    }
  }

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    if (mode === 'navigate') {
      // Navigate to services page with filters
      router.push(`/services?category=${categoryId}&subcategory=${subcategoryId}`)
      setHoveredCategoryId(null)
    } else {
      // Filter mode - use callbacks
      if (onSelectCategory) onSelectCategory(categoryId)
      if (onSelectSubcategory) onSelectSubcategory(subcategoryId)
      setHoveredCategoryId(null)
    }
  }

  const clearSelection = () => {
    if (mode === 'navigate') {
      router.push('/services')
    } else {
      if (onSelectCategory) onSelectCategory(null)
      if (onSelectSubcategory) onSelectSubcategory(null)
    }
    setHoveredCategoryId(null)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  // Get selected subcategory from fetched data
  const selectedSubcategory = selectedSubcategoryId
    ? subcategoriesData.get(selectedCategoryId || '')?.find(sc => sc.id === selectedSubcategoryId)
    : undefined

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Active Filter Badge - Only show in filter mode */}
      {mode === 'filter' && (selectedCategoryId || selectedSubcategoryId) && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Active filter:</span>
          <Badge
            variant="secondary"
            className="px-3 py-1.5 text-sm flex items-center gap-2"
          >
            <span>
              {selectedSubcategory?.name || selectedCategory?.name}
            </span>
            <button
              onClick={clearSelection}
              className="hover:bg-gray-400 rounded-full p-0.5 transition-colors"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Horizontal Category Links with Dividers */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* All Categories Link */}
        <button
          onClick={clearSelection}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
            !selectedCategoryId
              ? "text-blue-600"
              : "text-gray-700 hover:text-blue-600"
          )}
        >
          All Categories
        </button>

        {/* Divider */}
        <span className="text-gray-300">|</span>

        {/* Category Links */}
        {categories.map((category, index) => {
          const isActive = selectedCategoryId === category.id
          const categorySubcategories = subcategoriesData.get(category.id) || []
          const hasSubcategories = categorySubcategories.length > 0
          const isHovered = hoveredCategoryId === category.id

          return (
            <React.Fragment key={category.id}>
              <div className="relative">
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  onMouseEnter={() => !isTouchDevice && hasSubcategories && handleMouseEnter(category.id)}
                  onMouseLeave={() => !isTouchDevice && handleMouseLeave()}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  )}
                >
                  <span>{category.name}</span>
                  {hasSubcategories && (
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        isHovered && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {/* Hover Mega Menu Dropdown */}
                {hasSubcategories && isHovered && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto"
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Multi-column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 min-w-[600px] max-w-[1000px]">
                      {categorySubcategories.map((subcategory) => (
                        <div key={subcategory.id} className="space-y-1">
                          {/* Subcategory Header - CLICKABLE */}
                          <button
                            onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                            className={cn(
                              "font-bold text-gray-900 hover:bg-blue-50 hover:text-blue-600 w-full text-left px-2 py-1 rounded transition-colors text-sm",
                              selectedSubcategoryId === subcategory.id && "text-blue-600 bg-blue-50"
                            )}
                          >
                            {subcategory.name}
                          </button>

                          {/* Sub-items List - CLICKABLE (same action as header) */}
                          {subcategory.items && subcategory.items.length > 0 && (
                            <div className="space-y-0.5 ml-2">
                              {subcategory.items.map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                                  className="text-sm text-gray-600 hover:text-blue-600 w-full text-left px-2 py-0.5 rounded transition-colors block"
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider between categories */}
              {index < categories.length - 1 && (
                <span className="text-gray-300">|</span>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
