'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Loader2,
  CreditCard,
  Building,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { formatDistanceToNow } from 'date-fns'

interface Transaction {
  id: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND' | 'FEE'
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  description: string
  projectTitle?: string
  projectId?: string
  stripeTransactionId?: string
  createdAt: string
  completedAt?: string
  failureReason?: string
  paymentMethod?: {
    type: string
    last4?: string
    brand?: string
  }
}

interface TransactionHistoryProps {
  projectId?: string
  limit?: number
}

export function TransactionHistory({ projectId, limit }: TransactionHistoryProps) {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'FAILED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState<'ALL' | 'WEEK' | 'MONTH' | 'YEAR'>('ALL')

  useEffect(() => {
    fetchTransactions()
  }, [projectId, filter, dateRange])

  const fetchTransactions = async () => {
    try {
      // For now, use empty array since backend payment endpoints don't exist yet
      // This can be replaced with actual API calls when backend endpoints are available
      const realTransactions: Transaction[] = []
      
      let filteredTransactions = realTransactions
      
      if (projectId) {
        filteredTransactions = filteredTransactions.filter(t => t.projectId === projectId)
      }
      
      if (filter !== 'ALL') {
        filteredTransactions = filteredTransactions.filter(t => t.status === filter)
      }
      
      if (limit) {
        filteredTransactions = filteredTransactions.slice(0, limit)
      }
      
      setTransactions(filteredTransactions)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'PENDING') return <Clock className="w-5 h-5 text-yellow-500" />
    if (status === 'FAILED') return <XCircle className="w-5 h-5 text-red-500" />
    
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case 'PAYMENT':
        return <ArrowUpRight className="w-5 h-5 text-blue-500" />
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-5 h-5 text-purple-500" />
      case 'REFUND':
        return <RefreshCw className="w-5 h-5 text-orange-500" />
      case 'FEE':
        return <Building className="w-5 h-5 text-gray-500" />
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatAmount = (amount: number, type: string) => {
    const sign = ['DEPOSIT', 'REFUND'].includes(type) ? '+' : '-'
    return `${sign}$${amount.toLocaleString()}`
  }

  const getPaymentMethodDisplay = (paymentMethod?: Transaction['paymentMethod']) => {
    if (!paymentMethod) return null
    
    return (
      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <CreditCard className="w-3 h-3" />
        <span>{paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading transactions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {projectId ? 'Project Transactions' : 'Transaction History'}
          </h2>
          <p className="text-gray-600 mt-1">
            View and manage your payment history
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Time</option>
              <option value="WEEK">Last Week</option>
              <option value="MONTH">Last Month</option>
              <option value="YEAR">Last Year</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'ALL' 
              ? "Try adjusting your search criteria or filters." 
              : "Your transaction history will appear here once you start making payments."
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {transaction.description}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {transaction.stripeTransactionId && (
                          <span>ID: {transaction.stripeTransactionId}</span>
                        )}
                        
                        {getPaymentMethodDisplay(transaction.paymentMethod)}
                      </div>
                      
                      {transaction.failureReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Failed: {transaction.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      ['DEPOSIT', 'REFUND'].includes(transaction.type)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {transaction.status === 'COMPLETED' && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {!limit && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Deposited</p>
              <p className="text-xl font-bold text-green-600">
                $
                {filteredTransactions
                  .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-blue-600">
                $
                {filteredTransactions
                  .filter(t => t.type === 'PAYMENT' && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-xl font-bold text-gray-600">
                $
                {filteredTransactions
                  .filter(t => t.type === 'FEE' && t.status === 'COMPLETED')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-xl font-bold text-yellow-600">
                $
                {filteredTransactions
                  .filter(t => t.status === 'PENDING')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}