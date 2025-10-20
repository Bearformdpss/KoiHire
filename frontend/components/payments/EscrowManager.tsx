'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Loader2,
  Shield,
  Calendar
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface Milestone {
  id: string
  title: string
  description: string
  amount: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'DISPUTED'
  dueDate?: string
  completedAt?: string
  approvedAt?: string
}

interface EscrowData {
  id: string
  projectId: string
  totalAmount: number
  releasedAmount: number
  status: 'FUNDED' | 'PARTIAL_RELEASE' | 'COMPLETED' | 'DISPUTED'
  milestones: Milestone[]
  createdAt: string
}

interface EscrowManagerProps {
  projectId: string
  isClient: boolean
  onPaymentRequired: (amount: number) => void
}

export function EscrowManager({ projectId, isClient, onPaymentRequired }: EscrowManagerProps) {
  const { user } = useAuthStore()
  const [escrow, setEscrow] = useState<EscrowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingMilestone, setProcessingMilestone] = useState<string | null>(null)

  useEffect(() => {
    fetchEscrowData()
  }, [projectId])

  const fetchEscrowData = async () => {
    try {
      // Mock escrow data - replace with actual API call
      const mockEscrow: EscrowData = {
        id: 'escrow-1',
        projectId,
        totalAmount: 2500,
        releasedAmount: 1000,
        status: 'PARTIAL_RELEASE',
        createdAt: new Date().toISOString(),
        milestones: [
          {
            id: 'milestone-1',
            title: 'Initial Design Mockups',
            description: 'Create wireframes and initial design concepts',
            amount: 1000,
            status: 'APPROVED',
            dueDate: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
            completedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            approvedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          },
          {
            id: 'milestone-2',
            title: 'Frontend Development',
            description: 'Implement responsive frontend using React',
            amount: 1500,
            status: 'COMPLETED',
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
            completedAt: new Date().toISOString(),
          }
        ]
      }
      setEscrow(mockEscrow)
    } catch (error) {
      console.error('Failed to fetch escrow data:', error)
      toast.error('Failed to load payment information')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveMilestone = async (milestoneId: string) => {
    setProcessingMilestone(milestoneId)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setEscrow(prev => {
        if (!prev) return null
        return {
          ...prev,
          milestones: prev.milestones.map(milestone =>
            milestone.id === milestoneId
              ? { ...milestone, status: 'APPROVED' as const, approvedAt: new Date().toISOString() }
              : milestone
          ),
          releasedAmount: prev.releasedAmount + (prev.milestones.find(m => m.id === milestoneId)?.amount || 0)
        }
      })
      
      toast.success('Milestone approved and payment released!')
    } catch (error) {
      console.error('Failed to approve milestone:', error)
      toast.error('Failed to approve milestone')
    } finally {
      setProcessingMilestone(null)
    }
  }

  const handleDisputeMilestone = async (milestoneId: string) => {
    setProcessingMilestone(milestoneId)
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEscrow(prev => {
        if (!prev) return null
        return {
          ...prev,
          milestones: prev.milestones.map(milestone =>
            milestone.id === milestoneId
              ? { ...milestone, status: 'DISPUTED' as const }
              : milestone
          )
        }
      })
      
      toast.success('Milestone dispute initiated. Our team will review this case.')
    } catch (error) {
      console.error('Failed to dispute milestone:', error)
      toast.error('Failed to initiate dispute')
    } finally {
      setProcessingMilestone(null)
    }
  }

  const handleFundEscrow = () => {
    if (escrow) {
      const remainingAmount = escrow.totalAmount - escrow.releasedAmount
      onPaymentRequired(remainingAmount)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-gray-600 bg-gray-100'
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100'
      case 'COMPLETED':
        return 'text-green-600 bg-green-100'
      case 'APPROVED':
        return 'text-purple-600 bg-purple-100'
      case 'DISPUTED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'APPROVED':
        return <Shield className="w-4 h-4" />
      case 'DISPUTED':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
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
        <span>Loading payment information...</span>
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Escrow Set Up</h3>
        <p className="text-gray-600 mb-6">
          Set up escrow to secure payments for this project.
        </p>
        {isClient && (
          <Button onClick={handleFundEscrow} className="bg-blue-600 hover:bg-blue-700">
            <Shield className="w-4 h-4 mr-2" />
            Fund Escrow
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Escrow Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Escrow Overview</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
            {escrow.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">${escrow.totalAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Released</p>
            <p className="text-2xl font-bold text-green-600">${escrow.releasedAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Remaining</p>
            <p className="text-2xl font-bold text-blue-600">${escrow.totalAmount - escrow.releasedAmount}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round((escrow.releasedAmount / escrow.totalAmount) * 100)}% released</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full" 
              style={{ width: `${(escrow.releasedAmount / escrow.totalAmount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
        
        <div className="space-y-4">
          {escrow.milestones.map((milestone, index) => (
            <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(milestone.status)}`}>
                      {getStatusIcon(milestone.status)}
                      <span className="ml-1">{milestone.status.replace('_', ' ')}</span>
                    </span>
                    <span className="text-lg font-semibold text-green-600">${milestone.amount}</span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{milestone.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {milestone.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Due: {formatDate(milestone.dueDate)}
                      </div>
                    )}
                    {milestone.completedAt && (
                      <div className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed: {formatDate(milestone.completedAt)}
                      </div>
                    )}
                    {milestone.approvedAt && (
                      <div className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Approved: {formatDate(milestone.approvedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {milestone.status === 'COMPLETED' && isClient && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveMilestone(milestone.id)}
                        disabled={processingMilestone === milestone.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingMilestone === milestone.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve & Pay
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisputeMilestone(milestone.id)}
                        disabled={processingMilestone === milestone.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Dispute
                      </Button>
                    </>
                  )}
                  {milestone.status === 'APPROVED' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Payment Released
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isClient && escrow.totalAmount > escrow.releasedAmount && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Need to Add Funds?</h3>
              <p className="text-blue-700 mt-1">
                Add additional funds to escrow for upcoming milestones.
              </p>
            </div>
            <Button
              onClick={handleFundEscrow}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}