'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase,
  Search,
  Loader2,
  X,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/authStore'
import { projectsApi } from '@/lib/api/projects'
import { useRouter } from 'next/navigation'
import { FreelancerSidebar } from './freelancer/FreelancerSidebar'
import { ProfileCard } from './freelancer/ProfileCard'
import { LevelProgressCard } from './freelancer/LevelProgressCard'
import { AvailabilityToggle } from './freelancer/AvailabilityToggle'

interface MyProject {
  id: string
  title: string
  description: string
  status: string
  minBudget: number
  maxBudget: number
  timeline: string
  updatedAt: string
  createdAt: string
  client: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    rating?: number
  }
  category: {
    id: string
    name: string
    slug: string
  }
}

export function FreelancerDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [projectFilter, setProjectFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [myProjects, setMyProjects] = useState<MyProject[]>([])
  const [loadingMyProjects, setLoadingMyProjects] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchMyProjects()
  }, [])

  const fetchMyProjects = async () => {
    try {
      setLoadingMyProjects(true)
      const response = await projectsApi.getMyProjects({
        limit: 20,
        sortBy: 'updatedAt',
        order: 'desc'
      })

      if (response.success && response.data) {
        const projects = response.data.data?.projects || response.data.projects || []
        setMyProjects(projects)
      }
    } catch (error) {
      console.error('Failed to fetch my projects:', error)
    } finally {
      setLoadingMyProjects(false)
    }
  }

  const filteredProjects = myProjects.filter((project) => {
    const matchesSearch = searchQuery === '' ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = projectFilter === 'all' ||
      project.status.toLowerCase().replace('_', ' ') === projectFilter.toLowerCase().replace('_', ' ')

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar - Desktop */}
      <FreelancerSidebar />

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-gray-50 border-r border-gray-200 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProfileCard />
            <LevelProgressCard />
            <AvailabilityToggle />
          </div>
        </div>
      )}

      {/* Main Content - With left margin on desktop */}
      <div className="lg:ml-[280px] pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
            <span>Menu</span>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your projects and discover new opportunities.
            </p>
          </div>

          {/* Active Projects Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Active Projects</h2>
                <p className="text-sm text-gray-600 mt-1">Track and manage your ongoing work</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-koi-orange focus:border-koi-orange"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-koi-orange focus:border-koi-orange"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {loadingMyProjects ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mr-2 text-koi-orange" />
                  <span className="text-gray-600">Loading your projects...</span>
                </div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-koi-orange hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 hover:text-koi-orange transition-colors">
                            {project.title}
                          </h3>
                          <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                            project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>
                            Client: <span className="font-medium text-gray-900">{project.client.firstName} {project.client.lastName}</span>
                          </span>
                          <span className="text-green-600 font-semibold">
                            ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {project.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            className="bg-koi-orange hover:bg-koi-orange/90 text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/projects/${project.id}/workspace`)
                            }}
                          >
                            <Briefcase className="w-4 h-4 mr-1" />
                            Workspace
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">No projects found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {searchQuery || projectFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Start applying to projects to see them here'
                    }
                  </p>
                  <Button
                    onClick={() => router.push('/projects')}
                    className="bg-koi-orange hover:bg-koi-orange/90 text-white"
                  >
                    Browse Projects
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
