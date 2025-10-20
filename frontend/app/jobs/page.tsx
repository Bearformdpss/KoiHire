'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, Filter, ChevronDown, Star, MapPin, Clock, Plus, Edit, Trash2 } from 'lucide-react'
import { ClientOnly } from '@/components/auth/RoleProtection'

export default function BrowseJobsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Real data - no mock data
  const jobs: any[] = []
  const recommendedFreelancers: any[] = []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (selectedStatus !== 'all' && job.status !== selectedStatus) return false
    if (selectedCategory !== 'all' && job.category.toLowerCase().replace(' ', '-') !== selectedCategory) return false
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    totalApplicants: jobs.reduce((sum, job) => sum + job.applicants, 0)
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Posted Jobs</h1>
            <p className="text-gray-600">Manage your projects and review applications</p>
          </div>
          <Button 
            onClick={() => window.location.href = '/post-project'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>


        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Total Jobs</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-green-600">{stats.active}</h3>
            <p className="text-gray-600 text-sm">Active</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-blue-600">{stats.inProgress}</h3>
            <p className="text-gray-600 text-sm">In Progress</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-gray-600">{stats.completed}</h3>
            <p className="text-gray-600 text-sm">Completed</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <h3 className="text-2xl font-bold text-purple-600">{stats.totalApplicants}</h3>
            <p className="text-gray-600 text-sm">Total Applicants</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Jobs</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="design">Design</option>
                <option value="writing">Writing</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Apply Button */}
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('_', ' ')}
                    </span>
                    {job.selectedFreelancer && (
                      <span className="text-sm text-blue-600 font-medium">
                        Assigned to: {job.selectedFreelancer}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">{job.description}</p>
                  
                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  {/* Job Details */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Budget</p>
                      <p className="font-semibold text-green-600">{job.budget}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Applications</p>
                      <p className="font-semibold">{job.applicants} received</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Views</p>
                      <p className="font-semibold">{job.views} views</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Posted</p>
                      <p className="font-semibold">{job.timePosted}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Deadline</p>
                      <p className="font-semibold">{job.deadline}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  {job.applicants > 0 && (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      View Applications ({job.applicants})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all' 
                ? "No jobs match your current filters." 
                : "You haven't posted any jobs yet."
              }
            </p>
            <Button 
              onClick={() => window.location.href = '/post-project'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Your First Job
            </Button>
          </div>
        )}
      </div>
    </div>
    </ClientOnly>
  )
}