'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Bookmark, 
  BookmarkPlus, 
  Bell, 
  Trash2, 
  Edit, 
  Search,
  Filter,
  Clock,
  Eye
} from 'lucide-react'
import { SearchFilters } from './AdvancedSearch'
import toast from 'react-hot-toast'

interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  alertsEnabled: boolean
  createdAt: string
  lastUsed: string
  resultCount?: number
}

interface SavedSearchesProps {
  currentFilters: SearchFilters
  onLoadSearch: (filters: SearchFilters) => void
  onSearch: () => void
}

export function SavedSearches({ currentFilters, onLoadSearch, onSearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)

  useEffect(() => {
    fetchSavedSearches()
  }, [])

  const fetchSavedSearches = async () => {
    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await savedSearchesApi.getSavedSearches()
      // setSavedSearches(response.searches || [])
      
      // For now, start with empty array - no mock data
      setSavedSearches([])
    } catch (error) {
      console.error('Failed to fetch saved searches:', error)
    }
  }

  const saveCurrentSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search')
      return
    }

    try {
      const newSearch: SavedSearch = {
        id: `search-${Date.now()}`,
        name: searchName.trim(),
        filters: currentFilters,
        alertsEnabled: false,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      }

      setSavedSearches(prev => [newSearch, ...prev])
      setShowSaveModal(false)
      setSearchName('')
      toast.success('Search saved successfully!')
    } catch (error) {
      console.error('Failed to save search:', error)
      toast.error('Failed to save search')
    }
  }

  const loadSearch = async (search: SavedSearch) => {
    try {
      // Update last used timestamp
      setSavedSearches(prev => 
        prev.map(s => 
          s.id === search.id 
            ? { ...s, lastUsed: new Date().toISOString() }
            : s
        )
      )
      
      onLoadSearch(search.filters)
      onSearch()
      toast.success(`Loaded search: ${search.name}`)
    } catch (error) {
      console.error('Failed to load search:', error)
      toast.error('Failed to load search')
    }
  }

  const deleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return

    try {
      setSavedSearches(prev => prev.filter(s => s.id !== searchId))
      toast.success('Search deleted successfully!')
    } catch (error) {
      console.error('Failed to delete search:', error)
      toast.error('Failed to delete search')
    }
  }

  const toggleAlerts = async (searchId: string) => {
    try {
      setSavedSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, alertsEnabled: !search.alertsEnabled }
            : search
        )
      )
      
      const search = savedSearches.find(s => s.id === searchId)
      toast.success(`Alerts ${search?.alertsEnabled ? 'disabled' : 'enabled'} for ${search?.name}`)
    } catch (error) {
      console.error('Failed to toggle alerts:', error)
      toast.error('Failed to update alerts')
    }
  }

  const updateSearchName = async (searchId: string, newName: string) => {
    if (!newName.trim()) return

    try {
      setSavedSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, name: newName.trim() }
            : search
        )
      )
      
      setEditingSearch(null)
      toast.success('Search name updated!')
    } catch (error) {
      console.error('Failed to update search name:', error)
      toast.error('Failed to update search name')
    }
  }

  const formatFiltersPreview = (filters: SearchFilters) => {
    const parts = []
    
    if (filters.search) parts.push(`"${filters.search}"`)
    if (filters.category !== 'all') parts.push(filters.category)
    if (filters.minBudget || filters.maxBudget) {
      const budget = `$${filters.minBudget || 0}${filters.maxBudget ? `-$${filters.maxBudget}` : '+'}`
      parts.push(budget)
    }
    if (filters.skills.length > 0) parts.push(`${filters.skills.length} skills`)
    if (filters.remote) parts.push('Remote')
    
    return parts.join(' • ') || 'No filters'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const hasActiveFilters = () => {
    return currentFilters.search !== '' ||
           currentFilters.category !== 'all' ||
           currentFilters.minBudget !== null ||
           currentFilters.maxBudget !== null ||
           currentFilters.skills.length > 0 ||
           currentFilters.location !== '' ||
           currentFilters.clientRating !== null ||
           currentFilters.sortBy !== 'newest' ||
           currentFilters.projectLength !== 'any' ||
           currentFilters.experience !== 'any' ||
           currentFilters.remote !== null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bookmark className="w-5 h-5 mr-2 text-blue-600" />
          Saved Searches
        </h3>
        
        {hasActiveFilters() && (
          <Button
            onClick={() => setShowSaveModal(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BookmarkPlus className="w-4 h-4 mr-2" />
            Save Current Search
          </Button>
        )}
      </div>

      {savedSearches.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No saved searches yet.</p>
          <p className="text-sm">Save your favorite search filters to quickly access them later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSearches.map(search => (
            <div key={search.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {editingSearch?.id === search.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editingSearch.name}
                          onChange={(e) => setEditingSearch({ ...editingSearch, name: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateSearchName(search.id, editingSearch.name)
                            if (e.key === 'Escape') setEditingSearch(null)
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateSearchName(search.id, editingSearch.name)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium text-gray-900">{search.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSearch(search)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <Filter className="w-3 h-3 inline mr-1" />
                    {formatFiltersPreview(search.filters)}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>
                      <Clock className="w-3 h-3 inline mr-1" />
                      Used {formatDate(search.lastUsed)}
                    </span>
                    {search.resultCount !== undefined && (
                      <span>
                        <Eye className="w-3 h-3 inline mr-1" />
                        {search.resultCount} results
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleAlerts(search.id)}
                    className={search.alertsEnabled ? 'text-blue-600' : 'text-gray-400'}
                    title={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => loadSearch(search)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Load
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSearch(search.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Search</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Name
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., React Development Jobs"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentSearch()}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Current filters:</strong> {formatFiltersPreview(currentFilters)}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveModal(false)
                  setSearchName('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={saveCurrentSearch}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Search
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}