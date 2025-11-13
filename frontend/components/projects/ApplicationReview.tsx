'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  User,
  Star,
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar
} from 'lucide-react'
import { applicationsApi } from '@/lib/api/applications'
import { projectsApi } from '@/lib/api/projects'
import { messagesApi } from '@/lib/api/messages'
import toast from 'react-hot-toast'

interface Application {
  id: string
  proposedBudget: number
  coverLetter: string
  timeline: string
  status: string
  createdAt: string
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    bio?: string
    rating?: number
    location?: string
  }
}

interface ApplicationReviewProps {
  projectId: string
  onApplicationUpdate: () => void
}

export function ApplicationReview({ projectId, onApplicationUpdate }: ApplicationReviewProps) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingApplication, setProcessingApplication] = useState<string | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [projectId])

  const fetchApplications = async () => {
    try {
      const response = await applicationsApi.getProjectApplications(projectId)
      if (response.success) {
        setApplications(response.applications)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptApplication = async (applicationId: string) => {
    setProcessingApplication(applicationId)
    try {
      const response = await projectsApi.acceptApplication(projectId, applicationId)
      if (response.success) {
        toast.success('Application accepted successfully!')
        fetchApplications()
        onApplicationUpdate()
      }
    } catch (error: any) {
      console.error('Failed to accept application:', error)
      toast.error(error.response?.data?.message || 'Failed to accept application')
    } finally {
      setProcessingApplication(null)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    setProcessingApplication(applicationId)
    try {
      // Note: You'll need to implement the reject endpoint in the backend
      // For now, we'll just show a toast
      toast('Rejection functionality coming soon')
    } catch (error: any) {
      console.error('Failed to reject application:', error)
      toast.error(error.response?.data?.message || 'Failed to reject application')
    } finally {
      setProcessingApplication(null)
    }
  }

  const handleStartConversation = async (freelancerId: string) => {
    try {
      const response = await messagesApi.createConversation(projectId)
      if (response.success) {
        toast.success('Conversation started!')
        // Optionally redirect to messages
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start conversation')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading applications...</span>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-600">
          Applications from freelancers will appear here once they start applying to your project.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Applications ({applications.length})
        </h2>
        <div className="text-sm text-gray-600">
          {applications.filter(app => app.status === 'PENDING').length} pending
        </div>
      </div>

      <div className="grid gap-6">
        {applications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                {/* Freelancer Avatar */}
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                  {application.freelancer.avatar ? (
                    <img
                      src={application.freelancer.avatar}
                      alt={application.freelancer.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-600" />
                  )}
                </div>

                {/* Freelancer Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {application.freelancer.firstName} {application.freelancer.lastName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                      application.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">@{application.freelancer.username}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {application.freelancer.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span>{application.freelancer.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {application.freelancer.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{application.freelancer.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Applied {formatDate(application.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Status & Actions */}
              <div className="flex items-center space-x-2">
                {application.status === 'PENDING' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectApplication(application.id)}
                      disabled={processingApplication === application.id}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {processingApplication === application.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAcceptApplication(application.id)}
                      disabled={processingApplication === application.id}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {processingApplication === application.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Accept
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartConversation(application.freelancer.id)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>

            {/* Proposal Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Proposed Rate</p>
                  <p className="text-lg font-semibold text-green-600">{application.proposedBudget}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-sm text-gray-600">{application.timeline}</p>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Cover Letter</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            </div>

            {/* Bio */}
            {application.freelancer.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">About</h4>
                <p className="text-gray-700 text-sm">{application.freelancer.bio}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}