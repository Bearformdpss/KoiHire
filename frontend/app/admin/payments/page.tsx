'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'escrows'>('transactions')
  const [transactions, setTransactions] = useState<any[]>([])
  const [escrows, setEscrows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processingEscrowId, setProcessingEscrowId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    } else {
      fetchEscrows()
    }
  }, [activeTab, filters])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getTransactions({
        ...filters,
        search: searchTerm
      })
      if (response.success) {
        setTransactions(response.data.transactions)
      }
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const fetchEscrows = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getEscrows({
        status: filters.status,
        page: filters.page,
        limit: filters.limit
      })
      if (response.success) {
        setEscrows(response.data.escrows)
      }
    } catch (error: any) {
      console.error('Failed to fetch escrows:', error)
      toast.error('Failed to load escrows')
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseEscrow = async (escrowId: string) => {
    // Prevent double-click
    if (processingEscrowId === escrowId) {
      return
    }

    if (!confirm('Are you sure you want to release this escrow payment to the freelancer?')) {
      return
    }

    const reason = prompt('Enter reason for release (optional):')

    setProcessingEscrowId(escrowId)
    try {
      const response = await adminApi.releaseEscrow(escrowId, reason || undefined)
      if (response.success) {
        toast.success('Escrow released successfully')
        fetchEscrows()
      }
    } catch (error: any) {
      console.error('Failed to release escrow:', error)
      toast.error(error.message || 'Failed to release escrow')
    } finally {
      setProcessingEscrowId(null)
    }
  }

  const handleRefundEscrow = async (escrowId: string) => {
    // Prevent double-click
    if (processingEscrowId === escrowId) {
      return
    }

    const reason = prompt('Enter reason for refund (required):')
    if (!reason) {
      toast.error('Refund reason is required')
      return
    }

    if (!confirm('Are you sure you want to refund this escrow to the client?')) {
      return
    }

    setProcessingEscrowId(escrowId)
    try {
      const response = await adminApi.refundEscrow(escrowId, reason)
      if (response.success) {
        toast.success('Escrow refunded successfully')
        fetchEscrows()
      }
    } catch (error: any) {
      console.error('Failed to refund escrow:', error)
      toast.error(error.message || 'Failed to refund escrow')
    } finally {
      setProcessingEscrowId(null)
    }
  }

  const handleSearch = () => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
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

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all platform transactions and escrows</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('escrows')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'escrows'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Escrows
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {activeTab === 'transactions' && (
              <>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by user email or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="FEE">Fee</option>
                  <option value="REFUND">Refund</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </>
            )}

            {activeTab === 'escrows' && (
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="FUNDED">Funded</option>
                <option value="RELEASED">Released</option>
                <option value="REFUNDED">Refunded</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'transactions' && (
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b border-gray-200">
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Project/Service</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Stripe ID</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction: any) => (
                          <tr key={transaction.id} className="border-b border-gray-100">
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' :
                                transaction.type === 'WITHDRAWAL' ? 'bg-blue-100 text-blue-800' :
                                transaction.type === 'FEE' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="py-3">
                              <div>
                                <p className="font-medium text-gray-900">{transaction.user.username}</p>
                                <p className="text-xs text-gray-500">{transaction.user.email}</p>
                              </div>
                            </td>
                            <td className="py-3">
                              {transaction.escrow?.project?.title ||
                               transaction.serviceOrder?.service?.title ||
                               'N/A'}
                            </td>
                            <td className="py-3 font-medium">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="py-3 text-xs text-gray-500 font-mono">
                              {transaction.stripeId || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'escrows' && (
            <div className="space-y-4">
              {escrows.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No escrows found
                  </CardContent>
                </Card>
              ) : (
                escrows.map((escrow: any) => (
                  <Card key={escrow.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {escrow.project.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              escrow.status === 'FUNDED' ? 'bg-green-100 text-green-800' :
                              escrow.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              escrow.status === 'RELEASED' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {escrow.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              escrow.project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              escrow.project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Project: {escrow.project.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-600">Amount</p>
                              <p className="font-bold text-green-600">{formatCurrency(escrow.amount)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Client</p>
                              <p className="font-medium">{escrow.project.client.username}</p>
                              <p className="text-xs text-gray-500">{escrow.project.client.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Freelancer</p>
                              <p className="font-medium">{escrow.project.freelancer?.username || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{escrow.project.freelancer?.email || ''}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Created</p>
                              <p className="font-medium">{formatDate(escrow.createdAt)}</p>
                            </div>
                          </div>

                          {/* Recent Transactions */}
                          {escrow.transactions && escrow.transactions.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-600 mb-2">Recent Transactions:</p>
                              <div className="space-y-2">
                                {escrow.transactions.map((txn: any) => (
                                  <div key={txn.id} className="flex items-center gap-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      txn.type === 'DEPOSIT' ? 'bg-green-100 text-green-800' :
                                      txn.type === 'WITHDRAWAL' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {txn.type}
                                    </span>
                                    <span className="font-medium">{formatCurrency(txn.amount)}</span>
                                    <span className="text-gray-600">{formatDate(txn.createdAt)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {escrow.status === 'FUNDED' && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleReleaseEscrow(escrow.id)}
                              disabled={processingEscrowId === escrow.id}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingEscrowId === escrow.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Releasing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Release
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefundEscrow(escrow.id)}
                              disabled={processingEscrowId === escrow.id}
                              className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processingEscrowId === escrow.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Refunding...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Refund
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
