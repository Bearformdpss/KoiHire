'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, DollarSign, Calendar, MessageCircle, Loader2 } from 'lucide-react'
import { FreelancerOnly } from '@/components/auth/RoleProtection'
import { applicationsApi } from '@/lib/api/applications'
import toast from 'react-hot-toast'

interface Application {
  id: string
  status: string
  coverLetter: string
  proposedBudget?: number
  timeline: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    title: string
    description: string
    minBudget: number
    maxBudget: number
    timeline: string
    client: {
      id: string
      username: string
      rating: number
    }
    _count?: {
      applications: number
    }
  }
}

export default function BrowseBidsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    if (!loading) {
      setRefreshing(true)
    }
    
    try {
      const response = await applicationsApi.getMyApplications()
      console.log('Applications API response:', response)
      
      if (response.success && response.applications) {
        setApplications(response.applications)
        console.log('Applications loaded:', response.applications.length)
      } else {
        console.warn('Invalid response format:', response)
        toast.error('No applications data received')
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to load your applications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepted'
      case 'REJECTED':
        return 'Rejected'
      case 'PENDING':
        return 'Pending'
      case 'IN_PROGRESS':
        return 'In Progress'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <FreelancerOnly>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </FreelancerOnly>
    )
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

  const filteredBids = applications.filter(application => {
    if (activeTab === 'all') return true
    if (activeTab === 'won') return application.status === 'ACCEPTED' || application.status === 'IN_PROGRESS'
    if (activeTab === 'pending') return application.status === 'PENDING'
    if (activeTab === 'lost') return application.status === 'REJECTED'
    return true
  })

  const stats = {
    total: applications.length,
    won: applications.filter(a => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS').length,
    pending: applications.filter(a => a.status === 'PENDING').length,
    lost: applications.filter(a => a.status === 'REJECTED').length,
    winRate: applications.length > 0 ? Math.round((applications.filter(a => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS').length / applications.length) * 100) : 0
  }

  return (
    <FreelancerOnly>
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Your Bids</h1>
          <p className="text-gray-600">Track the status of all your project applications</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Bids</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-green-600">{stats.won}</h3>
            <p className="text-gray-600 text-sm">Won</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
            <p className="text-gray-600 text-sm">Pending</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-red-600">{stats.lost}</h3>
            <p className="text-gray-600 text-sm">Lost</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-blue-600">{stats.winRate}%</h3>
            <p className="text-gray-600 text-sm">Win Rate</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-1 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Bids ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('won')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'won'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Won ({stats.won})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'lost'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lost ({stats.lost})
          </button>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {refreshing && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading applications...</span>
            </div>
          )}
          
          {filteredBids.filter(app => app && app.project).map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(application.status)}
                    <h3 className="text-xl font-semibold text-gray-900">
                      {application.project?.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {getStatusDisplay(application.status)}
                    </span>
                  </div>
                  
                  {/* Application Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Your Bid</p>
                        <p className="font-semibold text-green-600">
                          {application.proposedBudget ? `$${application.proposedBudget}` : 'To be discussed'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-semibold">{getTimeAgo(application.createdAt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Competition</p>
                      <p className="font-semibold">{application.project?._count?.applications || 'N/A'} applications</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Budget Range</p>
                      <p className="font-semibold">${application.project?.minBudget || 'N/A'} - ${application.project?.maxBudget || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Your Timeline */}
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-blue-400 mt-1" />
                      <div>
                        <p className="text-sm text-blue-600 mb-1">Your proposed timeline:</p>
                        <p className="text-blue-800">{application.timeline}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Your cover letter:</p>
                        <p className="text-gray-800 line-clamp-3">
                          {application.coverLetter.length > 150 
                            ? `${application.coverLetter.substring(0, 150)}...` 
                            : application.coverLetter
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
                      {application.project?.client?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{application.project?.client?.username || 'Unknown'}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span>★ {application.project?.client?.rating || 'N/A'}</span>
                        <span>•</span>
                        <span>Project timeline: {application.project?.timeline || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  {application.status === 'ACCEPTED' || application.status === 'IN_PROGRESS' ? (
                    <Button className="bg-green-600 hover:bg-green-700">
                      View Project
                    </Button>
                  ) : application.status === 'PENDING' ? (
                    <Button variant="outline">
                      View Details
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Application Closed
                    </Button>
                  )}
                  {application.status === 'ACCEPTED' || application.status === 'IN_PROGRESS' ? (
                    <Button variant="outline" className="mt-2 w-full">
                      Message Client
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBids.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'all' 
                ? "You haven't submitted any bids yet." 
                : `No bids with ${activeTab} status.`
              }
            </p>
            <Button onClick={() => window.location.href = '/marketplace'}>
              Browse Projects
            </Button>
          </div>
        )}
      </div>
    </div>
    </FreelancerOnly>
  )
}