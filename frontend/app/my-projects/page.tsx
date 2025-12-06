'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ClientOnly } from '@/components/auth/RoleProtection'
import { ApplicationReview } from '@/components/projects/ApplicationReview'
import PostProjectForm from '@/components/projects/PostProjectFormNew'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MessageCircle,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  Briefcase,
  Clock,
  X
} from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string
  minBudget: number
  maxBudget: number
  timeline: string
  status: string
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
  }
  skills?: Array<{
    skill: {
      id: string
      name: string
    }
  }>
  freelancer?: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  _count: {
    applications: number
  }
}

export default function MyProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await projectsApi.getMyProjects()
      console.log('My Projects API response:', response)
      if (response.success && response.data) {
        // The backend returns { success, data: { projects, pagination } }
        // apiCall wraps it again, so we need response.data.data.projects
        const projectsList = response.data.data?.projects || []
        console.log('Projects list:', projectsList)
        setProjects(projectsList)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load your projects')
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationUpdate = () => {
    fetchProjects()
  }

  const handleProjectCreated = (createdProject: any) => {
    setShowCreateModal(false)
    toast.success('Project created successfully!')
    // Redirect directly to the project details page
    if (createdProject?.id) {
      router.push(`/projects/${createdProject.id}`)
    } else {
      // Fallback: refresh projects list
      fetchProjects()
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your projects...</p>
          </div>
        </div>
      </ClientOnly>
    )
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {!selectedProject ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                  <p className="text-gray-600 mt-2">Manage your posted projects and applications</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-[#1e3a5f] hover:bg-[#152a45] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Project
                </Button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Projects
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title or description..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full">
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Projects List */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {projects.length === 0 
                      ? 'Start by posting your first project to find talented freelancers.'
                      : 'Try adjusting your search criteria or filters.'
                    }
                  </p>
                  {projects.length === 0 && (
                    <Button onClick={() => setShowCreateModal(true)} className="bg-[#1e3a5f] hover:bg-[#152a45] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Project
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {project.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {project.description}
                          </p>
                          
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span>${project.minBudget} - ${project.maxBudget}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Users className="w-4 h-4 mr-1" />
                              <span>{project._count.applications} applications</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>Posted {formatDate(project.createdAt)}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{project.timeline}</span>
                            </div>
                          </div>

                          {project.freelancer && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-900">
                                Assigned to: {project.freelancer.firstName} {project.freelancer.lastName}
                              </p>
                              <p className="text-sm text-blue-700">@{project.freelancer.username}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Category: {project.category.name}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View Applications ({project._count.applications})
                          </Button>
                          {project.freelancer && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push('/messages')}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Application Review View */
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedProject(null)}
                    className="mb-4 -ml-2"
                  >
                    ← Back to Projects
                  </Button>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedProject.title}</h1>
                  <p className="text-gray-600 mt-2">Review and manage applications</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${selectedProject.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Project
                  </Button>
                </div>
              </div>

              <ApplicationReview
                projectId={selectedProject.id}
                onApplicationUpdate={handleApplicationUpdate}
              />
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
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
    </ClientOnly>
  )
}