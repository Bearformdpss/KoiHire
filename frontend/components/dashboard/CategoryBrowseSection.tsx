'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { categoriesApi } from '@/lib/api/categories'
import { Loader2, ArrowRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
}

export function CategoryBrowseSection() {
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

  if (loading) {
    return (
      <div className="mb-8 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-600">Loading categories...</span>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-koi-navy">📁 Browse by Category</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => router.push(`/services?category=${category.slug}`)}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-koi-orange hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              {category.icon && (
                <span className="text-2xl">{category.icon}</span>
              )}
              <span className="font-medium text-gray-900 text-left">
                {category.name}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-koi-orange transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}
