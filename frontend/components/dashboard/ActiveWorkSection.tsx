'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ActiveWorkCard from './ActiveWorkCard'
import { freelancerWorkApi, WorkItem } from '@/lib/api/freelancer-work'
import { toast } from 'react-hot-toast'

interface ActiveWorkSectionProps {
  userId: string
}

const ITEMS_PER_PAGE = 12 // 3-4 columns × 3-4 rows

export default function ActiveWorkSection({ userId }: ActiveWorkSectionProps) {
  const router = useRouter()
  const [items, setItems] = useState<WorkItem[]>([])
  const [filteredItems, setFilteredItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'projects' | 'services'>('all')
  const [currentPage, setCurrentPage] = useState(0)

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const startIndex = currentPage * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = filteredItems.slice(startIndex, endIndex)

  useEffect(() => {
    fetchActiveWork()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [filter, items])

  const fetchActiveWork = async () => {
    setLoading(true)
    try {
      const response = await freelancerWorkApi.getActiveWork('all')
      if (response.success) {
        setItems(response.data.items)
      }
    } catch (error: any) {
      console.error('Failed to fetch active work:', error)
      toast.error('Failed to load active work')
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    let filtered = [...items]

    if (filter === 'projects') {
      filtered = filtered.filter(item => item.type === 'PROJECT')
    } else if (filter === 'services') {
      filtered = filtered.filter(item => item.type === 'SERVICE')
    }

    // Sort by most recent (already sorted from backend, but ensure consistency)
    filtered.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    setFilteredItems(filtered)
    setCurrentPage(0) // Reset to first page when filter changes
  }

  const handleNoteUpdate = async (itemId: string, note: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const itemType = item.type === 'PROJECT' ? 'project' : 'service'

    try {
      await freelancerWorkApi.saveNote(itemType, itemId, note)

      // Update local state
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === itemId ? { ...i, note, noteUpdatedAt: new Date().toISOString() } : i
        )
      )

      toast.success('Note saved successfully')
    } catch (error: any) {
      toast.error('Failed to save note')
      throw error
    }
  }

  const handleNoteDelete = async (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const itemType = item.type === 'PROJECT' ? 'project' : 'service'

    try {
      await freelancerWorkApi.deleteNote(itemType, itemId)

      // Update local state
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === itemId ? { ...i, note: null, noteUpdatedAt: null } : i
        )
      )

      toast.success('Note deleted successfully')
    } catch (error: any) {
      toast.error('Failed to delete note')
      throw error
    }
  }

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B]">Active Work</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track all your ongoing projects and service orders in one place
          </p>
        </div>

        {/* Filter Dropdown */}
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-koi-orange/20 focus:border-koi-orange transition-colors bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'projects' | 'services')}
        >
          <option value="all">All Active Work</option>
          <option value="projects">Projects Only</option>
          <option value="services">Services Only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-koi-orange" />
          <span className="ml-3 text-gray-600">Loading your active work...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {filter === 'projects' ? (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            There's Nothing to Display
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' && "You don't have any active work at the moment"}
            {filter === 'projects' && "You don't have any active projects"}
            {filter === 'services' && "You don't have any active service orders"}
          </p>
          <Button
            onClick={() => router.push(filter === 'services' ? '/services' : '/projects')}
            className="bg-koi-orange hover:bg-koi-orange/90 text-white"
          >
            {filter === 'services' ? 'Browse Services' : 'Browse Projects'}
          </Button>
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {currentItems.map((item) => (
              <ActiveWorkCard
                key={item.id}
                item={item}
                onNoteUpdate={handleNoteUpdate}
                onNoteDelete={handleNoteDelete}
              />
            ))}
          </div>

          {/* Carousel Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <span className="text-xs text-gray-500">
                  ({filteredItems.length} total items)
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
