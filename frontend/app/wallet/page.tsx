'use client'

import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { TransactionHistory } from '@/components/payments/TransactionHistory'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  Download 
} from 'lucide-react'

export default function WalletPage() {
  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Wallet</h1>
            <p className="text-gray-600">
              Manage your payments, transactions, and financial overview
            </p>
          </div>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Available Balance</h3>
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$0.00</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">In Escrow</h3>
                <ArrowDownLeft className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$0.00</p>
              <p className="text-sm text-gray-500 mt-2">0 active projects</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
                <ArrowUpRight className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-gray-900">$0.00</p>
              <p className="text-sm text-gray-500 mt-2">All time</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Button className="h-auto p-4 flex flex-col items-center space-y-2">
                <Plus className="w-6 h-6" />
                <span>Add Funds</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <ArrowUpRight className="w-6 h-6" />
                <span>Withdraw</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <CreditCard className="w-6 h-6" />
                <span>Payment Methods</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <Download className="w-6 h-6" />
                <span>Export Data</span>
              </Button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </AuthRequired>
  )
}