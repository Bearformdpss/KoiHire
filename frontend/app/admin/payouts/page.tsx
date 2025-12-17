'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [summary, setSummary] = useState({
    pendingCount: 0,
    pendingTotal: 0,
    processingCount: 0,
    completedToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    payoutMethod: '',
    page: 1,
    limit: 20
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [filters])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getPayouts({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setPayouts(response.data.payouts)
        setSummary(response.data.summary)
      }
    } catch (error: any) {
      console.error('Failed to fetch payouts:', error)
      toast.error('Failed to load payouts')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayout = async (payoutId: string) => {
    const notes = prompt('Enter admin notes (optional):')

    setActionLoading(payoutId)
    try {
      const response = await adminApi.processPayoutStart(payoutId, notes || undefined)
      if (response.success) {
        toast.success('Payout marked as processing')
        fetchPayouts()
      }
    } catch (error: any) {
      console.error('Failed to process payout:', error)
      toast.error(error.message || 'Failed to process payout')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCompletePayout = async (payoutId: string) => {
    const externalRef = prompt('Enter external reference (PayPal/Payoneer transaction ID):')
    const notes = prompt('Enter admin notes (optional):')

    if (!confirm('Are you sure you want to mark this payout as completed?')) {
      return
    }

    setActionLoading(payoutId)
    try {
      const response = await adminApi.completePayoutManually(payoutId, {
        externalReference: externalRef || undefined,
        adminNotes: notes || undefined
      })
      if (response.success) {
        toast.success('Payout marked as completed')
        fetchPayouts()
      }
    } catch (error: any) {
      console.error('Failed to complete payout:', error)
      toast.error(error.message || 'Failed to complete payout')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFailPayout = async (payoutId: string) => {
    const reason = prompt('Enter failure reason (required):')
    if (!reason) {
      toast.error('Failure reason is required')
      return
    }

    const notes = prompt('Enter admin notes (optional):')

    setActionLoading(payoutId)
    try {
      const response = await adminApi.failPayout(payoutId, {
        failureReason: reason,
        adminNotes: notes || undefined
      })
      if (response.success) {
        toast.success('Payout marked as failed')
        fetchPayouts()
      }
    } catch (error: any) {
      console.error('Failed to fail payout:', error)
      toast.error(error.message || 'Failed to update payout')
    } finally {
      setActionLoading(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleSearch = () => {
    fetchPayouts()
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getMethodBadge = (method: string) => {
    const styles: Record<string, string> = {
      STRIPE: 'bg-purple-100 text-purple-800',
      PAYPAL: 'bg-blue-100 text-blue-800',
      PAYONEER: 'bg-orange-100 text-orange-800'
    }
    return styles[method] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payouts Management</h1>
        <p className="text-gray-600 mt-2">Process and track freelancer payouts (PayPal & Payoneer)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{summary.pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Total</p>
                <p className="text-xl font-bold">{formatCurrency(summary.pendingTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-xl font-bold">{summary.processingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-xl font-bold">{summary.completedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by freelancer email or username..."
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
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              value={filters.payoutMethod}
              onChange={(e) => setFilters({ ...filters, payoutMethod: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Methods</option>
              <option value="PAYPAL">PayPal</option>
              <option value="PAYONEER">Payoneer</option>
              <option value="STRIPE">Stripe</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {payouts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No payouts found
              </CardContent>
            </Card>
          ) : (
            payouts.map((payout: any) => (
              <Card key={payout.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(payout.status)}`}>
                          {payout.status}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getMethodBadge(payout.payoutMethod)}`}>
                          {payout.payoutMethod === 'PAYPAL' ? '💳 PayPal' : payout.payoutMethod === 'PAYONEER' ? '💼 Payoneer' : payout.payoutMethod}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(payout.amount)}
                        </span>
                      </div>

                      {/* Freelancer Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Freelancer</p>
                          <p className="font-medium">{payout.user.firstName} {payout.user.lastName}</p>
                          <p className="text-xs text-gray-500">@{payout.user.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            {payout.payoutMethod === 'PAYPAL' ? 'PayPal Email' : payout.payoutMethod === 'PAYONEER' ? 'Payoneer Email' : 'Payout Email'}
                          </p>
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-blue-600">{payout.payoutEmail || 'N/A'}</p>
                            {payout.payoutEmail && (
                              <button
                                onClick={() => copyToClipboard(payout.payoutEmail)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Copy email to clipboard"
                              >
                                <Copy className="w-3 h-3 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600">Platform Fee</p>
                          <p className="font-medium">{formatCurrency(payout.platformFee)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Source</p>
                          <p className="font-medium">
                            {payout.project
                              ? `Project: ${payout.project.title?.substring(0, 30)}...`
                              : payout.serviceOrder
                                ? `Order: ${payout.serviceOrder.orderNumber}`
                                : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Created</p>
                          <p className="font-medium">{formatDate(payout.createdAt)}</p>
                        </div>
                        {payout.processedAt && (
                          <div>
                            <p className="text-gray-600">Processing Started</p>
                            <p className="font-medium">{formatDate(payout.processedAt)}</p>
                          </div>
                        )}
                        {payout.completedAt && (
                          <div>
                            <p className="text-gray-600">Completed</p>
                            <p className="font-medium">{formatDate(payout.completedAt)}</p>
                          </div>
                        )}
                        {payout.externalReference && (
                          <div>
                            <p className="text-gray-600">External Reference</p>
                            <p className="font-mono text-xs">{payout.externalReference}</p>
                          </div>
                        )}
                      </div>

                      {/* Failure Reason */}
                      {payout.failureReason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-800">Failure Reason:</p>
                              <p className="text-sm text-red-700">{payout.failureReason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {payout.adminNotes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                          <p className="text-sm text-gray-600">{payout.adminNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col gap-2">
                      {payout.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {actionLoading === payout.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Clock className="w-4 h-4 mr-2" />
                            )}
                            Start Processing
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleCompletePayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFailPayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark Failed
                          </Button>
                        </>
                      )}
                      {payout.status === 'PROCESSING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleCompletePayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === payout.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFailPayout(payout.id)}
                            disabled={actionLoading === payout.id}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark Failed
                          </Button>
                        </>
                      )}
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
