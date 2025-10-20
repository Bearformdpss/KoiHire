'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { RoleProtection } from '@/components/auth/RoleProtection'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  CheckCircle,
  MessageCircle,
  Upload,
  Eye,
  AlertCircle
} from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string
  requirements?: string
  minBudget: number
  maxBudget: number
  timeline: string
  status: string
  createdAt: string
  updatedAt: string
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
  skills: Array<{
    skill: {
      id: string
      name: string
    }
  }>
}

export default function ProjectWorkspacePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Progress update form state
  const [updateForm, setUpdateForm] = useState({
    type: 'PROGRESS',
    title: '',
    description: '',
    attachments: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectsApi.getProject(projectId)
      
      if (response.success && response.data && (response.data as any).project) {
        setProject((response.data as any).project)
      } else {
        toast.error('Failed to load project')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING_REVIEW':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleFormChange = (field: keyof typeof updateForm, value: string) => {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitUpdate = async () => {
    if (!updateForm.title.trim() || !updateForm.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: API call to submit progress update
      // const response = await projectUpdatesApi.create(projectId, updateForm)
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Progress update submitted successfully!')
      setUpdateForm({
        type: 'PROGRESS',
        title: '',
        description: '',
        attachments: []
      })
      
      // TODO: Refresh progress updates list
    } catch (error) {
      console.error('Failed to submit progress update:', error)
      toast.error('Failed to submit progress update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkForReview = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to submit this project for client approval? This will change the project status to "Pending Review" and notify the client.'
    )
    
    if (!confirmed) return

    try {
      setIsSubmitting(true)
      
      // Call API to submit project for review
      const response = await projectsApi.submitForReview(projectId)
      
      if (response.success) {
        toast.success('Project submitted for client approval!')
        
        // Refresh project data to show new status
        await fetchProject()
      } else {
        toast.error(response.message || 'Failed to submit project for review')
      }
      
    } catch (error) {
      console.error('Failed to submit project for review:', error)
      toast.error('Failed to submit project for review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'progress', label: 'Progress', icon: CheckCircle },
    { id: 'files', label: 'Files', icon: Upload },
    { id: 'communication', label: 'Messages', icon: MessageCircle }
  ]

  if (loading) {
    return (
      <AuthRequired>
        <RoleProtection allowedRoles={['FREELANCER']}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading project workspace...</p>
            </div>
          </div>
        </RoleProtection>
      </AuthRequired>
    )
  }

  if (!project) {
    return (
      <AuthRequired>
        <RoleProtection allowedRoles={['FREELANCER']}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
              <p className="text-gray-600 mb-6">This project doesn't exist or you don't have access to it.</p>
              <Button onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </RoleProtection>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <RoleProtection allowedRoles={['FREELANCER']}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>Client: {project.client.firstName} {project.client.lastName}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Started: {formatDate(project.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Timeline: {project.timeline}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Project Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h3>
                      <p className="text-gray-700 leading-relaxed">{project.description}</p>
                    </div>

                    {project.requirements && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                        <p className="text-gray-700 leading-relaxed">{project.requirements}</p>
                      </div>
                    )}

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <span
                            key={skill.skill.id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {skill.skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Budget</span>
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${project.minBudget.toLocaleString()} - ${project.maxBudget.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Category</span>
                          <span className="font-medium">{project.category.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Timeline</span>
                          <span className="font-medium">{project.timeline}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Last Updated</span>
                          <span className="text-sm text-gray-500">{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Info</h3>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {project.client.avatar ? (
                            <img 
                              src={project.client.avatar} 
                              alt={project.client.firstName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold">
                              {project.client.firstName[0]}{project.client.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {project.client.firstName} {project.client.lastName}
                          </p>
                          <p className="text-sm text-gray-600">@{project.client.username}</p>
                          {project.client.rating && (
                            <p className="text-sm text-yellow-600">★ {project.client.rating}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => setActiveTab('communication')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message Client
                      </Button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button className="w-full" onClick={() => setActiveTab('progress')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Update Progress
                        </Button>
                        <Button className="w-full" variant="outline" onClick={() => setActiveTab('files')}>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                        {project.status === 'IN_PROGRESS' && (
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleMarkForReview}
                            disabled={isSubmitting}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Processing...' : 'Submit for Approval'}
                          </Button>
                        )}
                        {project.status === 'PENDING_REVIEW' && (
                          <div className="w-full bg-orange-100 text-orange-800 px-4 py-2 rounded-md text-center">
                            <CheckCircle className="w-4 h-4 mr-2 inline" />
                            Submitted for Client Approval
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="space-y-6">
                  {/* Progress Update Form */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Create Progress Update</h3>
                      <Button 
                        onClick={handleSubmitUpdate}
                        disabled={isSubmitting || !updateForm.title.trim() || !updateForm.description.trim()}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Update'}
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Type
                        </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={updateForm.type}
                          onChange={(e) => handleFormChange('type', e.target.value)}
                        >
                          <option value="PROGRESS">General Progress</option>
                          <option value="MILESTONE">Milestone Completion</option>
                          <option value="DELIVERABLE">Deliverable Submission</option>
                          <option value="ISSUE">Issue or Blocker</option>
                          <option value="QUESTION">Question for Client</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Brief summary of your update..."
                          value={updateForm.title}
                          onChange={(e) => handleFormChange('title', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description *
                        </label>
                        <textarea
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Detailed description of your progress, achievements, or questions..."
                          value={updateForm.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Attachments (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Drop files here or <span className="text-blue-600 hover:text-blue-500 cursor-pointer">browse</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Images, documents, and archives up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Timeline */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Progress Timeline</h3>
                    
                    {/* Sample Progress Updates */}
                    <div className="space-y-6">
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">Milestone Completion</span>
                            <span className="text-xs text-gray-500">2 days ago</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            Initial design mockups completed
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Finished creating the initial wireframes and design mockups for the main pages. 
                            Ready for client review and feedback.
                          </p>
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              📎 design-mockups.zip
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">General Progress</span>
                            <span className="text-xs text-gray-500">5 days ago</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            Project setup and research phase
                          </h4>
                          <p className="text-sm text-gray-600">
                            Set up the development environment and completed initial research on user requirements. 
                            Beginning work on wireframes next.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">Project Started</span>
                            <span className="text-xs text-gray-500">1 week ago</span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">
                            Welcome! Project has been assigned
                          </h4>
                          <p className="text-sm text-gray-600">
                            Looking forward to working on this project. Will begin with research and planning phase.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Files</h3>
                  <div className="text-center py-12">
                    <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">File Management Coming Soon</h4>
                    <p className="text-gray-600">Upload deliverables and share files with your client.</p>
                  </div>
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Communication</h3>
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Messaging Integration Coming Soon</h4>
                    <p className="text-gray-600">Communicate with your client about this project.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </RoleProtection>
    </AuthRequired>
  )
}