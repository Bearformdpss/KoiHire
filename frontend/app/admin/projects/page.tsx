'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    hasEscrow: undefined as boolean | undefined,
    page: 1,
    limit: 20
  })

  useEffect(() => {
    fetchProjects()
  }, [filters])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getProjects({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setProjects(response.data.projects)
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (projectId: string) => {
    const newStatus = prompt('Enter new status (OPEN, PAUSED, IN_PROGRESS, PENDING_REVIEW, COMPLETED, CANCELLED, DISPUTED):')
    if (!newStatus) return

    const validStatuses = ['OPEN', 'PAUSED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED']
    if (!validStatuses.includes(newStatus)) {
      toast.error('Invalid status')
      return
    }

    const reason = prompt('Enter reason for status change (optional):')

    try {
      const response = await adminApi.updateProjectStatus(projectId, newStatus, reason || undefined)
      if (response.success) {
        toast.success('Project status updated')
        fetchProjects()
      }
    } catch (error: any) {
      console.error('Failed to update project:', error)
      toast.error(error.message || 'Failed to update project')
    }
  }

  const handleSearch = () => {
    fetchProjects()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all platform projects</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
            <select
              value={filters.hasEscrow === undefined ? '' : filters.hasEscrow.toString()}
              onChange={(e) => setFilters({
                ...filters,
                hasEscrow: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Projects</option>
              <option value="true">With Escrow</option>
              <option value="false">Without Escrow</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No projects found
              </CardContent>
            </Card>
          ) : (
            projects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                          project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                          project.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {project.status}
                        </span>
                        {project.escrow && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.escrow.status === 'FUNDED' ? 'bg-green-100 text-green-800' :
                            project.escrow.status === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Escrow: {project.escrow.status}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Budget</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(project.minBudget)} - {formatCurrency(project.maxBudget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Client</p>
                          <p className="font-medium">{project.client.username}</p>
                          <p className="text-xs text-gray-500">{project.client.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Freelancer</p>
                          <p className="font-medium">{project.freelancer?.username || 'Not assigned'}</p>
                          {project.freelancer && (
                            <p className="text-xs text-gray-500">{project.freelancer.email}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-600">Applications</p>
                          <p className="font-medium">{project._count.applications} bids</p>
                        </div>
                      </div>

                      {/* Escrow Details */}
                      {project.escrow && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4 text-sm">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                Escrow: {formatCurrency(project.escrow.amount)}
                              </p>
                              <p className="text-xs text-gray-600">
                                Created: {formatDate(project.escrow.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
                        <span>Category: {project.category.name}</span>
                        <span>•</span>
                        <span>Timeline: {project.timeline}</span>
                        <span>•</span>
                        <span>Posted: {formatDate(project.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/projects/${project.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(project.id)}
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
