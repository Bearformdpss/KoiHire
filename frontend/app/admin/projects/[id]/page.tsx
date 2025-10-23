'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, XCircle, DollarSign, MessageSquare, Users, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getProject(projectId)
      if (response.success) {
        setProject(response.data.project)
      }
    } catch (error: any) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      OPEN: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      DISPUTED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Project not found
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/projects')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-600 mt-1">Project ID: {project.id}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            {project.escrow && (
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                project.escrow.status === 'FUNDED' ? 'bg-green-100 text-green-800' :
                project.escrow.status === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                project.escrow.status === 'REFUNDED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                Escrow: {project.escrow.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert if Disputed */}
      {project.status === 'DISPUTED' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Project Disputed</h3>
                <p className="text-sm text-red-800">This project requires immediate attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Budget Range</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatCurrency(project.minBudget)} - {formatCurrency(project.maxBudget)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timeline</p>
                    <p className="font-semibold">{project.timeline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold">{project.category.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Posted Date</p>
                    <p className="font-semibold">{formatDate(project.createdAt)}</p>
                  </div>
                </div>

                {project.skills && project.skills.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Escrow & Transactions */}
          {project.escrow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Escrow & Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Escrow Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Escrow Amount</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(project.escrow.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-xl font-bold">{project.escrow.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-sm font-medium">{formatDate(project.escrow.createdAt)}</p>
                      </div>
                    </div>
                    {project.escrow.releasedAt && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-600">Released: {formatDate(project.escrow.releasedAt)}</p>
                      </div>
                    )}
                    {project.escrow.refundedAt && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-600">Refunded: {formatDate(project.escrow.refundedAt)}</p>
                      </div>
                    )}
                  </div>

                  {/* Transactions */}
                  {project.escrow.transactions && project.escrow.transactions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Transaction History</h4>
                      <div className="space-y-2">
                        {project.escrow.transactions.map((txn: any) => (
                          <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              {txn.status === 'COMPLETED' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : txn.status === 'FAILED' ? (
                                <XCircle className="w-5 h-5 text-red-600" />
                              ) : (
                                <Loader2 className="w-5 h-5 text-yellow-600" />
                              )}
                              <div>
                                <p className="font-medium">{txn.type}</p>
                                <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(txn.amount)}</p>
                              <p className={`text-xs ${
                                txn.status === 'COMPLETED' ? 'text-green-600' :
                                txn.status === 'FAILED' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {txn.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications/Bids */}
          {project.applications && project.applications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Applications ({project.applications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.applications.map((app: any) => (
                    <div key={app.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{app.freelancer.username}</p>
                          <p className="text-sm text-gray-500">{app.freelancer.email}</p>
                          <p className="text-xs text-gray-400">
                            Rating: {app.freelancer.rating ? `⭐ ${app.freelancer.rating.toFixed(1)}` : 'No ratings yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">{formatCurrency(app.proposedBudget)}</p>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                            app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                      {app.coverLetter && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">{app.coverLetter}</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Proposed timeline: {app.estimatedDuration} • Applied {formatDate(app.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages/Conversations */}
          {project.conversations && project.conversations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.conversations.map((conv: any) => (
                    <div key={conv.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Conversation</h4>
                      <div className="space-y-2">
                        {conv.messages && conv.messages.length > 0 ? (
                          conv.messages.map((msg: any) => (
                            <div key={msg.id} className="p-3 bg-gray-50 rounded">
                              <div className="flex items-start justify-between mb-1">
                                <p className="font-medium text-sm">{msg.sender?.username || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{formatDate(msg.createdAt)}</p>
                              </div>
                              <p className="text-sm text-gray-700">{msg.content}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No messages yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Parties & Actions */}
        <div className="space-y-6">
          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-lg">{project.client.username}</p>
                  <p className="text-sm text-gray-600">{project.client.email}</p>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">
                      {project.client.rating ? `⭐ ${project.client.rating.toFixed(1)}` : 'No ratings'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Spent</span>
                    <span className="font-medium">{formatCurrency(project.client.totalSpent || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Freelancer Details */}
          {project.freelancer && (
            <Card>
              <CardHeader>
                <CardTitle>Freelancer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{project.freelancer.username}</p>
                    <p className="text-sm text-gray-600">{project.freelancer.email}</p>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rating</span>
                      <span className="font-medium">
                        {project.freelancer.rating ? `⭐ ${project.freelancer.rating.toFixed(1)}` : 'No ratings'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Earnings</span>
                      <span className="font-medium">{formatCurrency(project.freelancer.totalEarnings || 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const newStatus = prompt('Enter new status (OPEN, PAUSED, IN_PROGRESS, PENDING_REVIEW, COMPLETED, CANCELLED, DISPUTED):')
                    if (newStatus) {
                      adminApi.updateProjectStatus(projectId, newStatus)
                        .then(() => {
                          toast.success('Status updated')
                          fetchProject()
                        })
                        .catch(() => toast.error('Failed to update status'))
                    }
                  }}
                >
                  Update Status
                </Button>

                {project.escrow && project.escrow.status === 'FUNDED' && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        if (confirm('Release escrow payment to freelancer?')) {
                          const reason = prompt('Reason for release (optional):')
                          adminApi.releaseEscrow(project.escrow.id, reason || undefined)
                            .then(() => {
                              toast.success('Escrow released')
                              fetchProject()
                            })
                            .catch((err) => toast.error(err.message || 'Failed to release escrow'))
                        }
                      }}
                    >
                      Release Escrow
                    </Button>

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        const reason = prompt('Reason for refund (required):')
                        if (reason) {
                          if (confirm('Refund escrow to client?')) {
                            adminApi.refundEscrow(project.escrow.id, reason)
                              .then(() => {
                                toast.success('Escrow refunded')
                                fetchProject()
                              })
                              .catch((err) => toast.error(err.message || 'Failed to refund escrow'))
                          }
                        } else {
                          toast.error('Refund reason is required')
                        }
                      }}
                    >
                      Refund Escrow
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-medium">{project.applications?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversations</span>
                  <span className="font-medium">{project.conversations?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Has Escrow</span>
                  <span className="font-medium">{project.escrow ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
