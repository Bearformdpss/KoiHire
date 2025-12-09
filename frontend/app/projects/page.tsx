'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Briefcase, CheckCircle } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { applicationsApi } from '@/lib/api/applications'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  createdAt: string
  client: {
    id: string
    username: string
    rating: number
  }
  category: {
    id: string
    name: string
  }
  _count: {
    applications: number
  }
}

export default function ProjectsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [appliedProjects, setAppliedProjects] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchProjects()
  }, [])

  // Check which projects the user has already applied to
  useEffect(() => {
    const checkAppliedProjects = async () => {
      if (user?.role !== 'FREELANCER' || projects.length === 0) return

      const projectIds = projects.map(p => p.id)

      try {
        const response = await applicationsApi.checkApplicationStatusBatch(projectIds)
        if (response.success) {
          setAppliedProjects(prev => ({ ...prev, ...response.appliedProjects }))
        }
      } catch (error) {
        console.error('Error checking applied projects:', error)
      }
    }

    checkAppliedProjects()
  }, [projects, user])

  const fetchProjects = async (reset = false) => {
    try {
      const pageToFetch = reset ? 1 : currentPage
      const response = await projectsApi.getProjects({
        page: pageToFetch,
        limit: 20,
        sortBy: 'newest'
      })

      if (response.success && response.data) {
        if (reset) {
          setProjects(response.data.projects || [])
          setCurrentPage(2)
        } else {
          setProjects(prev => [...prev, ...(response.data.projects || [])])
          setCurrentPage(prev => prev + 1)
        }

        if (response.data.pagination) {
          setHasMore(pageToFetch < response.data.pagination.totalPages)
        } else {
          setHasMore((response.data.projects || []).length === 20)
        }
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handlePostProject = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to post a project')
      router.push('/register')
      return
    }
    router.push('/post-project')
  }

  const handleApplyNow = (projectId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to apply for projects')
      router.push('/register')
      return
    }
    router.push(`/projects/${projectId}`)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-koi-orange" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-koi-orange to-koi-teal py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-koi-navy mb-2">Browse Projects</h1>
              <p className="text-xl text-koi-navy">Find your next opportunity</p>
            </div>
            <button
              onClick={handlePostProject}
              className="bg-white text-koi-orange px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
            >
              Post a Project
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-koi-orange focus:border-transparent">
                <option>All Categories</option>
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>Design & Creative</option>
                <option>Writing & Translation</option>
                <option>Marketing & SEO</option>
                <option>Data & Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-koi-navy mb-2">
                Budget Range
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-koi-orange focus:border-transparent">
                <option>Any Budget</option>
                <option>Under $500</option>
                <option>$500 - $1,000</option>
                <option>$1,000 - $5,000</option>
                <option>$5,000+</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full bg-white text-koi-orange py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md border border-koi-orange">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-koi-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-koi-orange" />
              </div>
              <h3 className="text-lg font-bold text-koi-navy mb-2">No projects found</h3>
              <p className="text-gray-600">
                No projects are currently available. Check back later!
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-koi-navy mb-2 hover:text-koi-orange transition-colors cursor-pointer">
                      {project.title}
                    </h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-bold text-green-600">
                        ${project.minBudget} - ${project.maxBudget}
                      </span>
                      <span className="px-3 py-1 bg-koi-orange/10 text-koi-orange rounded-full font-medium">
                        {project.category.name}
                      </span>
                      <span className="text-gray-600">
                        {project._count.applications} application{project._count.applications !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-500">
                        Posted {getTimeAgo(project.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="ml-6">
                    {appliedProjects[project.id] ? (
                      <button
                        disabled
                        className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold cursor-not-allowed shadow-md flex items-center whitespace-nowrap"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Applied
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyNow(project.id)}
                        className="bg-white text-koi-orange px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md border border-koi-orange whitespace-nowrap"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {projects.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchProjects(false)}
              className="px-6 py-3 border-2 border-koi-orange text-koi-orange rounded-lg font-semibold hover:bg-koi-orange hover:text-white transition-all"
            >
              Load More Projects
            </button>
          </div>
        )}

        {projects.length > 0 && !hasMore && (
          <div className="text-center mt-8">
            <p className="text-gray-600 font-medium">All projects loaded</p>
          </div>
        )}
      </div>
    </div>
  )
}
