'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { recommendationsApi, RecommendedProject } from '@/lib/api/recommendations'
import { ProjectOpportunityCard } from './ProjectOpportunityCard'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function OpportunitiesSection() {
  const router = useRouter()
  const [projects, setProjects] = useState<RecommendedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(false)
      const response = await recommendationsApi.getRecommendedProjects(10)

      if (response.success && response.data) {
        setProjects(response.data.projects)
      }
    } catch (err: any) {
      console.error('Error fetching new projects:', err)
      setError(true)
      // Don't show error toast, just fail silently and show empty state
    } finally {
      setLoading(false)
    }
  }

  const handleBrowseAll = () => {
    router.push('/projects')
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
        </div>
      </div>
    )
  }

  // Empty state (no error, just no projects)
  if (!error && projects.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">New Projects</h2>
            <p className="text-gray-600 text-sm mt-1">
              No new projects available. Check back soon for new opportunities.
            </p>
          </div>
          <button
            onClick={handleBrowseAll}
            className="text-[#FF6B35] hover:text-[#E55A2A] font-medium text-sm flex items-center gap-1 transition-colors"
          >
            Browse All
            <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  // Error state - fail silently, don't show section
  if (error) {
    return null
  }

  // Success state with projects
  return (
    <div className="bg-gray-50 rounded-lg p-6 md:p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B]">New Projects</h2>
          <p className="text-gray-600 text-sm mt-1">
            Recently posted opportunities for you to explore
          </p>
        </div>
        <button
          onClick={handleBrowseAll}
          className="text-[#FF6B35] hover:text-[#E55A2A] font-medium text-sm flex items-center gap-1 transition-colors"
        >
          Browse All
          <span>→</span>
        </button>
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectOpportunityCard key={project.id} project={project} />
        ))}
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory -mx-6 px-6">
        {projects.map((project) => (
          <div key={project.id} className="min-w-[280px] snap-start">
            <ProjectOpportunityCard project={project} />
          </div>
        ))}
      </div>
    </div>
  )
}
