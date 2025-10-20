'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { StripeProvider } from '@/lib/stripe/StripeProvider'
import { PaymentForm } from '@/components/payments/PaymentForm'
import { EscrowManager } from '@/components/payments/EscrowManager'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CreditCard, Shield } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  status: string
  minBudget: number
  maxBudget: number
  clientId: string
  client: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  freelancer?: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
}

export default function ProjectPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [activeTab, setActiveTab] = useState<'escrow' | 'payment'>('escrow')

  const projectId = params.id as string

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await projectsApi.getProject(projectId)
      if (response.success) {
        setProject(response.data)
      } else {
        toast.error('Project not found')
        router.push('/marketplace')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project details')
      router.push('/marketplace')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentRequired = (amount: number) => {
    setPaymentAmount(amount)
    setActiveTab('payment')
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = () => {
    toast.success('Payment processed successfully!')
    setShowPaymentForm(false)
    setActiveTab('escrow')
    // Refresh project data
    fetchProject()
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`)
  }

  const isClient = user?.id === project?.clientId

  if (loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </AuthRequired>
    )
  }

  if (!project) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <StripeProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Navigation */}
            <div className="flex items-center space-x-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push(`/projects/${projectId}`)}
                className="-ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Project</span>
                <span>•</span>
                <span className="font-medium text-gray-900">{project.title}</span>
                <span>•</span>
                <span>Payments</span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payment & Escrow Management
              </h1>
              <p className="text-gray-600">
                Secure payment processing with milestone-based releases
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setActiveTab('escrow')
                    setShowPaymentForm(false)
                  }}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'escrow'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-2 inline" />
                  Escrow Management
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    activeTab === 'payment'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  disabled={!isClient}
                >
                  <CreditCard className="w-4 h-4 mr-2 inline" />
                  Make Payment
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                {activeTab === 'escrow' && (
                  <EscrowManager
                    projectId={projectId}
                    isClient={isClient}
                    onPaymentRequired={handlePaymentRequired}
                  />
                )}

                {activeTab === 'payment' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Secure Payment
                      </h2>
                      <p className="text-gray-600">
                        Fund your project escrow to get started
                      </p>
                    </div>

                    <PaymentForm
                      amount={paymentAmount || project.maxBudget}
                      projectId={projectId}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Project Info Sidebar */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Budget Range</h4>
                  <p className="text-2xl font-bold text-green-600">
                    ${project.minBudget} - ${project.maxBudget}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {project.freelancer && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Working With</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {project.freelancer.firstName.charAt(0)}{project.freelancer.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {project.freelancer.firstName} {project.freelancer.lastName}
                      </p>
                      <p className="text-sm text-gray-600">@{project.freelancer.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </StripeProvider>
    </AuthRequired>
  )
}