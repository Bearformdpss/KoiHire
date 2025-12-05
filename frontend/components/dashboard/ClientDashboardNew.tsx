'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { projectsApi } from '@/lib/api/projects'
import { Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import PostProjectForm from '@/components/projects/PostProjectFormNew'

// Import new sections
import { HeroSection } from './HeroSection'
import { CategoryPills } from '@/components/services/CategoryPills'
import { GuidanceCards } from './GuidanceCards'
import { QuickActionBar } from './QuickActionBar'
import { ActiveProjectsSection } from './ActiveProjectsSection'
import { FeaturedServicesSection } from './FeaturedServicesSection'
import { TopFreelancersSection } from './TopFreelancersSection'
import { RecentServicesSection } from './RecentServicesSection'
import { CategoryBrowseSection } from './CategoryBrowseSection'
import { HomepageCategoryCards } from './HomepageCategoryCards'
import { ActionBanner } from './ActionBanner'
import { categoriesApi } from '@/lib/api/categories'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  status: string
  createdAt: string
  _count: {
    applications: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  _count?: {
    services?: number
  }
}

export function ClientDashboardNew() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchCategories()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await projectsApi.getMyProjects({
        status: 'OPEN' // Only show active projects in overview
      })

      if (response.success && response.data?.data?.projects) {
        setProjects(response.data.data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      // Silently fail - just show empty state
    } finally {
      setLoadingProjects(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await categoriesApi.getCategories()
      if (response.success) {
        setCategories(response.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleProjectCreated = () => {
    setShowCreateModal(false)
    toast.success('Project created successfully!')
    fetchProjects() // Refresh projects
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Action Banner */}
        <ActionBanner />

        {/* Hero Section with Search */}
        <HeroSection />

        {/* Category Pills with Navigation */}
        {!loadingCategories && categories.length > 0 && (
          <div className="mb-6">
            <CategoryPills
              categories={categories}
              mode="navigate"
            />
          </div>
        )}

        {/* Guidance Cards - Post Project or Browse Services */}
        <GuidanceCards onPostProject={() => setShowCreateModal(true)} />

        {/* Popular Services (Previously Recently Added Services) */}
        <RecentServicesSection />

        {/* Homepage-style Category Cards */}
        <HomepageCategoryCards />

        {/* Top Rated Freelancers */}
        <TopFreelancersSection />

        {/* Featured Services */}
        <FeaturedServicesSection />

        {/* Project Creation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <PostProjectForm
                  onClose={() => setShowCreateModal(false)}
                  onSuccess={handleProjectCreated}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
