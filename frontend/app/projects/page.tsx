'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Search } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
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
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
  _count: {
    applications: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Projects</h1>
            <p className="text-gray-600 mt-2">Find your next opportunity</p>
          </div>
          <Button>
            Post a Project
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Categories</option>
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>Design</option>
                <option>Writing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Any Budget</option>
                <option>Under $1,000</option>
                <option>$1,000 - $5,000</option>
                <option>$5,000+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <input
                type="text"
                placeholder="e.g. React, Node.js"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">
                No projects are currently available. Check back later!
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.skills.map((skill) => (
                        <span
                          key={skill.skill.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {skill.skill.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="font-semibold text-green-600">
                        ${project.minBudget} - ${project.maxBudget}
                      </span>
                      <span>{project.category.name}</span>
                      <span>{project._count.applications} applications</span>
                      <span>Posted {getTimeAgo(project.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <Button>
                      Apply Now
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {projects.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <Button 
              variant="outline"
              onClick={() => fetchProjects(false)}
            >
              Load More Projects
            </Button>
          </div>
        )}

        {projects.length > 0 && !hasMore && (
          <div className="text-center mt-8">
            <p className="text-gray-600">All projects loaded</p>
          </div>
        )}
      </div>
    </div>
  )
}