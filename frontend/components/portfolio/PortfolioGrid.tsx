'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Search, Filter, Grid, List, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PortfolioCard } from './PortfolioCard'
import { PortfolioModal } from './PortfolioModal'
import { usePortfolioModal } from '@/hooks/usePortfolioModal'
import { 
  Portfolio, 
  PortfolioCategory, 
  portfoliosApi, 
  GetPortfoliosParams,
  formatPortfolioCategory 
} from '@/lib/api/portfolios'

interface PortfolioGridProps {
  userId?: string
  showUserFilter?: boolean
  showAddButton?: boolean
  initialCategory?: PortfolioCategory
  className?: string
  onAddPortfolio?: () => void
}

export function PortfolioGrid({ 
  userId, 
  showUserFilter = true,
  showAddButton = false,
  initialCategory,
  className = '',
  onAddPortfolio
}: PortfolioGridProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PortfolioCategory | 'ALL'>(
    initialCategory || 'ALL'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Portfolio modal
  const portfolioModal = usePortfolioModal()

  const categories = Object.values(PortfolioCategory)

  const fetchPortfolios = async (page = 1, reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const params: GetPortfoliosParams = {
        page,
        limit: 12
      }

      if (userId) params.userId = userId
      if (selectedCategory !== 'ALL') params.category = selectedCategory
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const response = await portfoliosApi.getPortfolios(params)
      
      if (response.success) {
        if (reset || page === 1) {
          setPortfolios(response.portfolios)
        } else {
          setPortfolios(prev => [...prev, ...response.portfolios])
        }
        setTotalPages(response.pagination.pages)
        setCurrentPage(page)
      } else {
        setError('Failed to load portfolios')
      }
    } catch (err) {
      setError('Failed to load portfolios. Please try again.')
      console.error('Error fetching portfolios:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPortfolios(1, true)
  }, [userId, selectedCategory, searchQuery])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: PortfolioCategory | 'ALL') => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      fetchPortfolios(currentPage + 1, false)
    }
  }

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchQuery || selectedCategory !== 'ALL' ? 'No portfolios found' : 'No portfolios yet'}
      </h3>
      <p className="text-gray-600 mb-4">
        {searchQuery || selectedCategory !== 'ALL' 
          ? 'Try adjusting your filters or search query'
          : userId 
            ? 'Start showcasing your work by adding your first portfolio'
            : 'Check back later for amazing work from our freelancers'
        }
      </p>
      {showAddButton && onAddPortfolio && (
        <Button onClick={onAddPortfolio}>
          <Plus className="w-4 h-4 mr-2" />
          Add Portfolio
        </Button>
      )}
    </div>
  )

  const renderErrorState = () => (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <Button onClick={() => fetchPortfolios(1, true)} variant="outline">
        Try Again
      </Button>
    </div>
  )

  if (error && portfolios.length === 0) {
    return renderErrorState()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search portfolios..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Filter Toggle */}
          {showUserFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          )}

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`${viewMode === 'grid' ? 'bg-gray-100' : ''} rounded-r-none`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`${viewMode === 'list' ? 'bg-gray-100' : ''} rounded-l-none border-l`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Button */}
          {showAddButton && onAddPortfolio && (
            <Button onClick={onAddPortfolio}>
              <Plus className="w-4 h-4 mr-2" />
              Add Portfolio
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      {(showFilters || !showUserFilter) && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('ALL')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {formatPortfolioCategory(category)}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && portfolios.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
          {selectedCategory !== 'ALL' && ` in ${formatPortfolioCategory(selectedCategory)}`}
        </div>
      )}

      {/* Portfolio Grid */}
      {portfolios.length > 0 ? (
        <>
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {portfolios.map((portfolio) => (
              <PortfolioCard
                key={portfolio.id}
                portfolio={portfolio}
                showUser={!userId}
                className={viewMode === 'list' ? 'flex flex-row' : ''}
                onPortfolioClick={(portfolio, imageIndex) => portfolioModal.openModal(portfolio, imageIndex)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {currentPage < totalPages && (
            <div className="text-center">
              <Button
                onClick={loadMore}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      ) : !loading ? (
        renderEmptyState()
      ) : null}

      {/* Loading State */}
      {loading && portfolios.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading portfolios...</span>
        </div>
      )}

      {/* Portfolio Modal */}
      <PortfolioModal
        isOpen={portfolioModal.isOpen}
        portfolio={portfolioModal.portfolio}
        currentImageIndex={portfolioModal.currentImageIndex}
        onClose={portfolioModal.closeModal}
        onPrevious={portfolioModal.previousImage}
        onNext={portfolioModal.nextImage}
        onImageClick={portfolioModal.goToImage}
      />
    </div>
  )
}