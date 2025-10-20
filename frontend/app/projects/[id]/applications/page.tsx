'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Filter, Star, MapPin, Calendar, DollarSign, User, MessageCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { projectsApi } from '@/lib/api/projects'

interface Application {
  id: string
  coverLetter: string
  proposedBudget: number
  timeline: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  createdAt: string
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    bio?: string
    rating: number
    location?: string
    isVerified: boolean
    skills: Array<{
      skill: {
        id: string
        name: string
      }
    }>
  }
}

interface Project {
  id: string
  title: string
  minBudget: number
  maxBudget: number
  status: string
  clientId: string
}

interface Filters {
  status: string
  minBudget: string
  maxBudget: string
  minRating: string
  location: string
  verified: string
  timeline: string
  sortBy: string
  order: 'asc' | 'desc'
}

export default function ApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [applications, setApplications] = useState<Application[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<Filters>({
    status: '',
    minBudget: '',
    maxBudget: '',
    minRating: '',
    location: '',
    verified: '',
    timeline: '',
    sortBy: 'createdAt',
    order: 'desc'
  })

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      // Build filter params, excluding empty values
      const filterParams: Record<string, any> = {}
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          filterParams[key] = value
        }
      })

      const response = await fetch(`/api/applications/project/${projectId}?${new URLSearchParams(filterParams)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }

      const data = await response.json()
      
      if (data.success) {
        setApplications(data.applications || [])
      } else {
        throw new Error(data.message || 'Failed to load applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchProject = async () => {
    try {
      const response = await projectsApi.getProject(projectId)
      if (response.success) {
        setProject(response.data.project)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to load project details')
    }
  }

  useEffect(() => {
    fetchProject()
    fetchApplications()
  }, [projectId])

  useEffect(() => {
    fetchApplications()
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      minBudget: '',
      maxBudget: '',
      minRating: '',
      location: '',
      verified: '',
      timeline: '',
      sortBy: 'createdAt',
      order: 'desc'
    })
  }

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      const response = await projectsApi.acceptApplication(projectId, applicationId)
      if (response.success) {
        toast.success('Application accepted successfully!')
        fetchApplications()
        fetchProject()
      }
    } catch (error) {
      console.error('Error accepting application:', error)
      toast.error('Failed to accept application')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading && !applications.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            {project && (
              <p className="text-gray-600 mt-1">{project.title}</p>
            )}
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filter Applications</h3>
            <button 
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            {/* Min Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
              <select 
                value={filters.minRating} 
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any rating</option>
                <option value="4">4+ stars</option>
                <option value="3">3+ stars</option>
                <option value="2">2+ stars</option>
                <option value="1">1+ stars</option>
              </select>
            </div>

            {/* Min Budget Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
              <input
                type="number"
                placeholder="$0"
                value={filters.minBudget}
                onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Budget Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.maxBudget}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                placeholder="Search location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Timeline Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline Contains</label>
              <input
                type="text"
                placeholder="e.g. weeks, months"
                value={filters.timeline}
                onChange={(e) => handleFilterChange('timeline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Date Applied</option>
                  <option value="budget">Budget</option>
                  <option value="rating">Rating</option>
                  <option value="timeline">Timeline</option>
                </select>
                <select 
                  value={filters.order} 
                  onChange={(e) => handleFilterChange('order', e.target.value as 'asc' | 'desc')}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="verified"
              checked={filters.verified === 'true'}
              onChange={(e) => handleFilterChange('verified', e.target.checked ? 'true' : '')}
              className="mr-2"
            />
            <label htmlFor="verified" className="text-sm text-gray-700">Verified freelancers only</label>
          </div>
        </div>
      )}

      {/* Applications Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {applications.length} application{applications.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {Object.values(filters).some(f => f !== '' && f !== 'createdAt' && f !== 'desc')
                ? 'Try adjusting your filters to see more applications.'
                : 'No freelancers have applied to this project yet.'}
            </p>
          </div>
        ) : (
          applications.map((application) => (
            <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Freelancer Avatar */}
                <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {application.freelancer.avatar ? (
                    <Image
                      src={application.freelancer.avatar}
                      alt={application.freelancer.username}
                      width={64}
                      height={64}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">
                          {application.freelancer.firstName} {application.freelancer.lastName}
                        </h3>
                        {application.freelancer.isVerified && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">@{application.freelancer.username}</p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(application.proposedBudget)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{application.freelancer.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Freelancer Info */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    {application.freelancer.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{application.freelancer.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Timeline: {application.timeline}</span>
                    </div>
                    <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Skills */}
                  {application.freelancer.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {application.freelancer.skills.slice(0, 5).map((userSkill) => (
                          <span key={userSkill.skill.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {userSkill.skill.name}
                          </span>
                        ))}
                        {application.freelancer.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{application.freelancer.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cover Letter */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Cover Letter</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {application.coverLetter}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/messages?user=${application.freelancer.id}&project=${projectId}`)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/profile/${application.freelancer.username}`)}
                        >
                          View Profile
                        </Button>
                      </div>

                      {application.status === 'PENDING' && project?.status === 'OPEN' && (
                        <Button
                          onClick={() => handleAcceptApplication(application.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Accept Application
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}