'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Subcategory {
  id: string
  name: string
  slug: string
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
  selectedCategoryId: string | null
  selectedSubcategoryId?: string | null
  onSelectCategory: (categoryId: string | null) => void
  onSelectSubcategory?: (subcategoryId: string | null) => void
  className?: string
}

export function CategoryPills({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
  className
}: CategoryPillsProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)

    // If category has subcategories, toggle dropdown
    if (category?.subcategories && category.subcategories.length > 0) {
      setOpenDropdownId(openDropdownId === categoryId ? null : categoryId)
    } else {
      // If no subcategories, select the category directly
      onSelectCategory(categoryId)
      setOpenDropdownId(null)
    }
  }

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    onSelectCategory(categoryId)
    if (onSelectSubcategory) {
      onSelectSubcategory(subcategoryId)
    }
    setOpenDropdownId(null)
  }

  const clearSelection = () => {
    onSelectCategory(null)
    if (onSelectSubcategory) {
      onSelectSubcategory(null)
    }
    setOpenDropdownId(null)
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)
  const selectedSubcategory = selectedCategory?.subcategories?.find(
    sc => sc.id === selectedSubcategoryId
  )

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Active Filter Badge */}
      {(selectedCategoryId || selectedSubcategoryId) && (
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
          const hasSubcategories = category.subcategories && category.subcategories.length > 0
          const isDropdownOpen = openDropdownId === category.id

          return (
            <React.Fragment key={category.id}>
              <div className="relative">
                <button
                  onClick={() => handleCategoryClick(category.id)}
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
                        isDropdownOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {/* Subcategory Dropdown */}
                {hasSubcategories && isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      {category.subcategories!.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                            selectedSubcategoryId === subcategory.id
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {subcategory.name}
                        </button>
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
