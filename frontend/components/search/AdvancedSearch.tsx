'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Calendar,
  DollarSign,
  Clock,
  Tag,
  MapPin,
  Star,
  Settings,
  RotateCcw
} from 'lucide-react'

export interface SearchFilters {
  search: string
  category: string
  minBudget: number | null
  maxBudget: number | null
  location: string
  clientRating: number | null
  sortBy: 'newest' | 'oldest' | 'budget_high' | 'budget_low' | 'applications'
  projectLength: 'any' | 'short' | 'medium' | 'long'
  experience: 'any' | 'entry' | 'intermediate' | 'expert'
  remote: boolean | null
}

interface AdvancedSearchProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  onSearch: () => void
  isLoading?: boolean
}

const initialFilters: SearchFilters = {
  search: '',
  category: 'all',
  minBudget: null,
  maxBudget: null,
  location: '',
  clientRating: null,
  sortBy: 'newest',
  projectLength: 'any',
  experience: 'any',
  remote: null
}

export function AdvancedSearch({
  filters,
  onFiltersChange,
  categories,
  onSearch,
  isLoading = false
}: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    setLocalFilters(initialFilters)
    onFiltersChange(initialFilters)
  }

  const hasActiveFilters = () => {
    return localFilters.search !== '' ||
           localFilters.category !== 'all' ||
           localFilters.minBudget !== null ||
           localFilters.maxBudget !== null ||
           localFilters.location !== '' ||
           localFilters.clientRating !== null ||
           localFilters.sortBy !== 'newest' ||
           localFilters.projectLength !== 'any' ||
           localFilters.experience !== 'any' ||
           localFilters.remote !== null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Basic Search Row */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search projects by title, description, or skills..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <Button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        <Button 
          onClick={onSearch}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-6 space-y-6">
          {/* Category Filter */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={localFilters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={localFilters.minBudget || ''}
                  onChange={(e) => updateFilter('minBudget', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Min"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  value={localFilters.maxBudget || ''}
                  onChange={(e) => updateFilter('maxBudget', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Max"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={localFilters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                placeholder="Any location"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={localFilters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="budget_high">Highest Budget</option>
                <option value="budget_low">Lowest Budget</option>
                <option value="applications">Most Applications</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Length
              </label>
              <select
                value={localFilters.projectLength}
                onChange={(e) => updateFilter('projectLength', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="any">Any Length</option>
                <option value="short">Short (1-4 weeks)</option>
                <option value="medium">Medium (1-3 months)</option>
                <option value="long">Long (3+ months)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={localFilters.experience}
                onChange={(e) => updateFilter('experience', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="any">Any Level</option>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center space-x-4">
              {hasActiveFilters() && (
                <Button 
                  onClick={resetFilters}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Filters</span>
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {hasActiveFilters() && 'Active filters applied'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}