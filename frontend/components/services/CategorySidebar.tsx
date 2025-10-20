'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  _count?: {
    services?: number
    projects?: number
  }
}

interface CategorySidebarProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (categoryId: string | null) => void
  className?: string
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className
}: CategorySidebarProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <p className="text-xs text-gray-500 mt-1">Browse services by category</p>
      </div>

      <nav className="space-y-1" role="navigation" aria-label="Service categories">
        {/* All Categories Option */}
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            selectedCategoryId === null
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-gray-700 hover:bg-gray-100"
          )}
          aria-current={selectedCategoryId === null ? "page" : undefined}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <span>All Categories</span>
          </span>
          <span className="text-xs text-gray-500">
            {categories.reduce((sum, cat) => sum + (cat._count?.services || 0), 0)}
          </span>
        </button>

        {/* Individual Categories */}
        {categories.map((category) => {
          const serviceCount = category._count?.services || 0
          const isSelected = selectedCategoryId === category.id

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isSelected
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              aria-current={isSelected ? "page" : undefined}
            >
              <span className="flex items-center gap-2">
                {category.icon && (
                  <span className="text-base" role="img" aria-label={category.name}>
                    {category.icon}
                  </span>
                )}
                <span className="text-left">{category.name}</span>
              </span>
              <span className="text-xs text-gray-500">
                {serviceCount}
              </span>
            </button>
          )
        })}
      </nav>
    </Card>
  )
}
