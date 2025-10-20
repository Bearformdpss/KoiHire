'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users, 
  Eye,
  MessageCircle,
  Loader2,
  Star,
  BadgeCheck,
  User,
  Settings,
  Pause,
  Play,
  X,
  Edit3,
  AlertTriangle
} from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { messagesApi } from '@/lib/api/messages'
import { useAuthStore } from '@/lib/store/authStore'
import BidSubmissionModal from '@/components/projects/BidSubmissionModal'
import { ReviewForm } from '@/components/reviews/ReviewForm'
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
    location?: string
  }
  freelancer?: {
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
  _count: {
    applications: number
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBidModal, setShowBidModal] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  
  // Quick Actions state
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showTimelineModal, setShowTimelineModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Review Actions state
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false)
  const [requestChangesMessage, setRequestChangesMessage] = useState('')
  
  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  const projectId = params.id as string

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  // Close quick actions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQuickActions && !(event.target as Element)?.closest('.quick-actions-container')) {
        setShowQuickActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickActions])

  const fetchProject = async () => {
    try {
      console.log('🔍 [ProjectDetailPage] Fetching project:', projectId);
      const response = await projectsApi.getProject(projectId)
      console.log('📡 [ProjectDetailPage] API response:', response);
      
      if (response.success && response.data) {
        // Backend returns { success: true, project }, wrapped by apiCall becomes { success: true, data: { success: true, project }}
        const project = response.data.project;
        console.log('✅ [ProjectDetailPage] Project data:', project);
        setProject(project)
      } else {
        console.log('❌ [ProjectDetailPage] Project not found or failed response');
        toast.error('Project not found')
        router.push('/marketplace')
      }
    } catch (error) {
      console.error('💥 [ProjectDetailPage] Failed to fetch project:', error)
      toast.error('Failed to load project details')
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToProject = () => {
    if (!project) return
    setShowBidModal(true)
  }

  const handleBidSuccess = () => {
    toast.success('Application submitted successfully!')
    fetchProject() // Refresh project to update application count
  }

  const handleStartConversation = async () => {
    if (!project) return

    setCreatingConversation(true)
    try {
      const response = await messagesApi.createConversation(project.id)
      if (response.success && response.conversation) {
        toast.success('Opening conversation...')
        // Redirect to messages page with conversation ID as query parameter
        router.push(`/messages?conversationId=${response.conversation.id}`)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast.error('Failed to create conversation')
    } finally {
      setCreatingConversation(false)
    }
  }

  // Review Actions handlers
  const handleApproveProject = async () => {
    if (!project?.freelancer) return
    
    // Show review modal first instead of directly approving
    setShowReviewModal(true)
  }

  // Handle actual project approval after review flow
  const handleFinalApproval = async () => {
    if (!project) return
    
    setPendingApproval(true)
    try {
      const response = await projectsApi.approveProject(project.id)
      if (response.success) {
        toast.success(response.message || 'Project approved successfully! Freelancer has been notified.')
        setShowReviewModal(false)
        fetchProject() // Refresh project data
      }
    } catch (error) {
      console.error('Failed to approve project:', error)
      toast.error('Failed to approve project')
    } finally {
      setPendingApproval(false)
    }
  }

  // Handle review submission
  const handleReviewSuccess = () => {
    toast.success('Review submitted successfully!')
    handleFinalApproval() // Approve project after review
  }

  // Handle skipping review
  const handleSkipReview = () => {
    const confirmed = window.confirm(
      'Are you sure you want to skip leaving a review? This is a great opportunity to help other clients find quality freelancers.'
    )
    if (confirmed) {
      handleFinalApproval() // Approve project without review
    }
  }

  const handleRequestChanges = async () => {
    if (!project || !requestChangesMessage.trim()) {
      toast.error('Please provide a message explaining what changes are needed')
      return
    }
    
    setReviewLoading('changes')
    try {
      const response = await projectsApi.requestChanges(project.id, requestChangesMessage)
      if (response.success) {
        toast.success(response.message || 'Change request sent to freelancer!')
        setShowRequestChangesModal(false)
        setRequestChangesMessage('')
        fetchProject() // Refresh project data
      }
    } catch (error) {
      console.error('Failed to request changes:', error)
      toast.error('Failed to send change request')
    } finally {
      setReviewLoading(null)
    }
  }

  // Quick Actions handlers
  const handlePauseResume = async () => {
    if (!project) return
    
    setActionLoading('pause')
    try {
      const response = await projectsApi.pauseResumeProject(project.id)
      if (response.success) {
        toast.success(response.message || 'Project status updated successfully')
        fetchProject() // Refresh project data
      }
    } catch (error) {
      console.error('Failed to pause/resume project:', error)
      toast.error('Failed to update project status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelProject = async (reason?: string) => {
    if (!project) return
    
    setActionLoading('cancel')
    try {
      const response = await projectsApi.cancelProject(project.id, reason)
      if (response.success) {
        toast.success('Project cancelled successfully')
        fetchProject() // Refresh project data
        setShowCancelModal(false)
      }
    } catch (error) {
      console.error('Failed to cancel project:', error)
      toast.error('Failed to cancel project')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateTimeline = async (newTimeline: string, reason?: string) => {
    if (!project) return
    
    setActionLoading('timeline')
    try {
      const response = await projectsApi.updateTimeline(project.id, newTimeline, reason)
      if (response.success) {
        toast.success('Timeline updated successfully')
        fetchProject() // Refresh project data
        setShowTimelineModal(false)
      }
    } catch (error) {
      console.error('Failed to update timeline:', error)
      toast.error('Failed to update timeline')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateBudget = async (minBudget: number, maxBudget: number, reason?: string) => {
    if (!project) return
    
    setActionLoading('budget')
    try {
      const response = await projectsApi.updateBudget(project.id, minBudget, maxBudget, reason)
      if (response.success) {
        toast.success('Budget updated successfully')
        fetchProject() // Refresh project data
        setShowBudgetModal(false)
      }
    } catch (error) {
      console.error('Failed to update budget:', error)
      toast.error('Failed to update budget')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const canApply = user?.role === 'FREELANCER' && project?.status === 'OPEN'
  const canStartConversation = project?.freelancer && 
    (user?.id === project?.client?.id || user?.id === project?.freelancer?.id)
  const isProjectOwner = user?.id === project?.client?.id
  const canManageProject = isProjectOwner && project?.status !== 'IN_PROGRESS'

  if (loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading project details...</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  if (!project) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Project Header */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'PENDING_REVIEW' ? 'bg-orange-100 text-orange-800' :
                    project.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Posted {getTimeAgo(project.createdAt)}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {project.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${project.minBudget} - ${project.maxBudget}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {project.timeline}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {project._count?.applications || 0} applications
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.skills?.map((skill) => (
                    <span
                      key={skill?.skill?.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill?.skill?.name}
                    </span>
                  )) || null}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  {canApply && (
                    <Button onClick={handleApplyToProject} className="bg-blue-600 hover:bg-blue-700">
                      Apply for This Project
                    </Button>
                  )}
                  {canStartConversation && (
                    <Button
                      variant="outline"
                      onClick={handleStartConversation}
                      disabled={creatingConversation}
                    >
                      {creatingConversation ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4 mr-2" />
                      )}
                      Start Conversation
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${project.id}/files`)}
                  >
                    📁 Project Files
                  </Button>
                  
                  {/* View Applications - Only for project owner */}
                  {isProjectOwner && (
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/projects/${project.id}/applications`)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Applications ({project._count?.applications || 0})
                    </Button>
                  )}
                  
                  {/* Quick Actions - Only for project owner */}
                  {isProjectOwner && (
                    <div className="relative quick-actions-container">
                      <Button
                        variant="outline"
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="border-gray-300"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Project
                      </Button>
                      
                      {/* Quick Actions Dropdown */}
                      {showQuickActions && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                              Quick Actions
                            </div>
                            
                            {canManageProject && (
                              <>
                                {/* Pause/Resume Button */}
                                <button
                                  onClick={handlePauseResume}
                                  disabled={actionLoading === 'pause'}
                                  className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md disabled:opacity-50"
                                >
                                  {actionLoading === 'pause' ? (
                                    <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                                  ) : project?.status === 'PAUSED' ? (
                                    <Play className="w-4 h-4 mr-3 text-green-600" />
                                  ) : (
                                    <Pause className="w-4 h-4 mr-3 text-yellow-600" />
                                  )}
                                  {project?.status === 'PAUSED' ? 'Resume Project' : 'Pause Project'}
                                </button>
                                
                                {/* Timeline Extension */}
                                <button
                                  onClick={() => setShowTimelineModal(true)}
                                  className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md"
                                >
                                  <Clock className="w-4 h-4 mr-3 text-blue-600" />
                                  Update Timeline
                                </button>
                                
                                {/* Budget Update */}
                                <button
                                  onClick={() => setShowBudgetModal(true)}
                                  className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-md"
                                >
                                  <DollarSign className="w-4 h-4 mr-3 text-green-600" />
                                  Update Budget
                                </button>
                                
                                <div className="h-px bg-gray-200 my-2" />
                                
                                {/* Cancel Project */}
                                <button
                                  onClick={() => setShowCancelModal(true)}
                                  className="flex items-center w-full px-3 py-2 text-sm text-left hover:bg-red-50 text-red-600 rounded-md"
                                >
                                  <X className="w-4 h-4 mr-3" />
                                  Cancel Project
                                </button>
                              </>
                            )}
                            
                            {project?.status === 'IN_PROGRESS' && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                Project management disabled during active work
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Description */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                </div>
              </div>

              {/* Client Review Section - Only show when PENDING_REVIEW and user is client */}
              {project.status === 'PENDING_REVIEW' && isProjectOwner && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-600 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Project Review Required</h2>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Your freelancer has submitted the project for your review. Please examine the work and decide whether to approve it or request changes.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleApproveProject}
                      disabled={pendingApproval || showReviewModal}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      {pendingApproval ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="w-4 h-4 mr-2" />
                          Approve & Complete
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setShowRequestChangesModal(true)}
                      disabled={reviewLoading !== null}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50 flex-1"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {project.requirements && (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Specific Requirements</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{project.requirements}</p>
                  </div>
                </div>
              )}

              {/* Project Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Timeline</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Posted</p>
                      <p className="text-sm text-gray-600">{formatDate(project.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Expected Duration</p>
                      <p className="text-sm text-gray-600">{project.timeline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Client</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {project.client.avatar ? (
                      <img
                        src={project.client.avatar}
                        alt={project.client.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {project.client?.firstName} {project.client?.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">@{project.client?.username}</p>
                    
                    {project.client?.rating && (
                      <div className="flex items-center mt-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {project.client.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {project.client?.location && (
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 ml-1">{project.client.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Freelancer */}
              {project.freelancer && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Freelancer</h3>
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {project.freelancer.avatar ? (
                        <img
                          src={project.freelancer.avatar}
                          alt={project.freelancer.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {project.freelancer?.firstName} {project.freelancer?.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">@{project.freelancer?.username}</p>
                      
                      {project.freelancer?.rating && (
                        <div className="flex items-center mt-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">
                            {project.freelancer.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Project Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Category</p>
                    <p className="text-sm text-gray-600">{project.category?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Budget</p>
                    <p className="text-sm text-gray-600">${project.minBudget} - ${project.maxBudget}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Applications</p>
                    <p className="text-sm text-gray-600">{project._count?.applications || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bid Submission Modal */}
        {showBidModal && project && (
          <BidSubmissionModal
            project={{
              id: project.id,
              title: project.title,
              description: project.description,
              minBudget: project.minBudget,
              maxBudget: project.maxBudget,
              timeline: project.timeline,
              client: {
                id: project.client?.id || '',
                username: project.client?.username || '',
                rating: project.client?.rating || 0
              },
              category: {
                name: project.category?.name || ''
              },
              skills: project.skills || []
            }}
            isOpen={showBidModal}
            onClose={() => setShowBidModal(false)}
            onSuccess={handleBidSuccess}
          />
        )}

        {/* Cancel Project Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Project</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to cancel this project? This action cannot be undone.
                </p>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const reason = formData.get('reason') as string
                  handleCancelProject(reason)
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      name="reason"
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide a reason for cancelling this project..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowCancelModal(false)}
                      className="flex-1"
                    >
                      Keep Project
                    </Button>
                    <Button 
                      type="submit"
                      disabled={actionLoading === 'cancel'}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {actionLoading === 'cancel' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Cancel Project
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Update Modal */}
        {showTimelineModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Timeline</h3>
                <p className="text-gray-600 mb-4">
                  Extend or modify the project timeline. Current timeline: <strong>{project?.timeline}</strong>
                </p>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const timeline = formData.get('timeline') as string
                  const reason = formData.get('reason') as string
                  handleUpdateTimeline(timeline, reason)
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Timeline *
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      required
                      defaultValue={project?.timeline}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3 weeks, 2 months"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for change (optional)
                    </label>
                    <textarea
                      name="reason"
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please explain why you're updating the timeline..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowTimelineModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={actionLoading === 'timeline'}
                      className="flex-1"
                    >
                      {actionLoading === 'timeline' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Update Timeline
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Budget Update Modal */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Budget</h3>
                <p className="text-gray-600 mb-4">
                  Current budget: <strong>${project?.minBudget} - ${project?.maxBudget}</strong>
                </p>
                
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const minBudget = Number(formData.get('minBudget'))
                  const maxBudget = Number(formData.get('maxBudget'))
                  const reason = formData.get('reason') as string
                  handleUpdateBudget(minBudget, maxBudget, reason)
                }}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Budget *
                      </label>
                      <input
                        type="number"
                        name="minBudget"
                        required
                        min="1"
                        defaultValue={project?.minBudget}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Budget *
                      </label>
                      <input
                        type="number"
                        name="maxBudget"
                        required
                        min="1"
                        defaultValue={project?.maxBudget}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for change (optional)
                    </label>
                    <textarea
                      name="reason"
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please explain why you're updating the budget..."
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setShowBudgetModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={actionLoading === 'budget'}
                      className="flex-1"
                    >
                      {actionLoading === 'budget' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Update Budget
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Request Changes Modal */}
        {showRequestChangesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Changes</h3>
                <p className="text-gray-600 mb-4">
                  Please provide specific feedback about what changes you'd like the freelancer to make to the project.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Change Request Message *
                  </label>
                  <textarea
                    value={requestChangesMessage}
                    onChange={(e) => setRequestChangesMessage(e.target.value)}
                    rows={4}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Please be specific about what needs to be changed or improved..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {requestChangesMessage.length}/500 characters
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowRequestChangesModal(false)
                      setRequestChangesMessage('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRequestChanges}
                    disabled={reviewLoading === 'changes' || !requestChangesMessage.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {reviewLoading === 'changes' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal - Show after client clicks approve */}
        {showReviewModal && project?.freelancer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Leave a Review</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Help other clients by sharing your experience with {project.freelancer.firstName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <ReviewForm
                  projectId={project.id}
                  revieweeId={project.freelancer.id}
                  revieweeName={`${project.freelancer.firstName} ${project.freelancer.lastName}`}
                  onSuccess={handleReviewSuccess}
                  onCancel={() => setShowReviewModal(false)}
                />
                
                {/* Skip Review Option */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Don't want to leave a review right now?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleSkipReview}
                    disabled={pendingApproval}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {pendingApproval ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Completing Project...
                      </>
                    ) : (
                      'Skip Review & Complete Project'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthRequired>
  )
}