'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categoriesApi } from '@/lib/api/categories'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

export function CategoryChips() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getCategories()
      if (response.success) {
        // Handle both nested and direct response structures
        const categoriesList = response.data?.categories || response.categories || []
        setCategories(categoriesList)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryClick = (slug: string) => {
    router.push(`/services?category=${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading categories...</span>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.slug)}
          className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-koi-orange hover:text-koi-orange hover:bg-koi-orange/5 transition-colors whitespace-nowrap"
        >
          {category.icon && <span className="mr-1">{category.icon}</span>}
          {category.name}
        </button>
      ))}

      {/* Custom scrollbar hide styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  )
}
