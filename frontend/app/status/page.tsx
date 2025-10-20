'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/LoadingStates'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Wifi, 
  Database, 
  CreditCard, 
  Shield, 
  Server,
  RefreshCw,
  Clock,
  Activity,
  Eye,
  Users
} from 'lucide-react'
import { HealthCheckService, HealthStatus } from '@/lib/services/healthCheck'
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'
import { formatDistanceToNow } from 'date-fns'

export default function StatusPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const healthService = HealthCheckService.getInstance()
    
    // Initial health check
    checkHealth()
    
    // Listen for health updates
    const handleHealthUpdate = (status: HealthStatus) => {
      setHealthStatus(status)
      setLastUpdated(new Date())
      setLoading(false)
    }
    
    healthService.addListener(handleHealthUpdate)
    
    return () => {
      healthService.removeListener(handleHealthUpdate)
    }
  }, [])

  const checkHealth = async () => {
    setLoading(true)
    const healthService = HealthCheckService.getInstance()
    const status = await healthService.checkHealth(true)
    setHealthStatus(status)
    setLastUpdated(new Date())
    setLoading(false)
  }

  const getStatusIcon = (isHealthy: boolean) => {
    if (isHealthy) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = (status: HealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getOverallStatusMessage = () => {
    if (!isOnline) {
      return "You're currently offline. Status information may be outdated."
    }
    
    if (!healthStatus) {
      return "Checking system status..."
    }
    
    switch (healthStatus.status) {
      case 'healthy':
        return "All systems operational"
      case 'degraded':
        return "Some systems experiencing issues"
      case 'unhealthy':
        return "System experiencing major issues"
      default:
        return "Unknown system status"
    }
  }

  const services = [
    {
      name: 'API Service',
      key: 'api' as const,
      description: 'Core API endpoints and services',
      icon: <Server className="w-6 h-6" />
    },
    {
      name: 'Database',
      key: 'database' as const,
      description: 'Data storage and retrieval',
      icon: <Database className="w-6 h-6" />
    },
    {
      name: 'Authentication',
      key: 'authentication' as const,
      description: 'User login and security',
      icon: <Shield className="w-6 h-6" />
    },
    {
      name: 'Payment Processing',
      key: 'payments' as const,
      description: 'Stripe payment integration',
      icon: <CreditCard className="w-6 h-6" />
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Status</h1>
          <p className="text-gray-600">
            Real-time status and performance of RowFlow services
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {loading ? (
                <LoadingSpinner size="lg" />
              ) : healthStatus ? (
                <div className={`w-4 h-4 rounded-full ${
                  healthStatus.status === 'healthy' ? 'bg-green-500' :
                  healthStatus.status === 'degraded' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gray-300" />
              )}
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getOverallStatusMessage()}
                </h2>
                {healthStatus && (
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-1" />
                      Response time: {healthStatus.responseTime}ms
                    </div>
                    {lastUpdated && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                      </div>
                    )}
                    {healthStatus.environment && (
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {healthStatus.environment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {healthStatus && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                  {healthStatus.status.toUpperCase()}
                </span>
              )}
              
              <Button
                onClick={checkHealth}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Wifi className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Network Connection</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(isOnline)}
              <div>
                <p className="font-medium text-gray-900">
                  {isOnline ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  {isOnline ? 
                    'Your device is connected to the internet' : 
                    'No internet connection detected'
                  }
                </p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Server className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Service Status</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((service) => {
              const isHealthy = healthStatus?.services[service.key] || false
              
              return (
                <div key={service.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={isHealthy ? 'text-green-600' : 'text-red-600'}>
                        {service.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                    
                    {getStatusIcon(isHealthy)}
                  </div>
                  
                  <div className="mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isHealthy ? 'OPERATIONAL' : 'UNAVAILABLE'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System Information */}
        {healthStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Version</h4>
                <p className="text-gray-600">{healthStatus.version || 'Unknown'}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Environment</h4>
                <p className="text-gray-600">{healthStatus.environment || 'Unknown'}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Last Check</h4>
                <p className="text-gray-600">
                  {formatDistanceToNow(new Date(healthStatus.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Status page automatically refreshes every minute. 
            For support, contact{' '}
            <a 
              href="mailto:support@rowflow.com" 
              className="text-blue-600 hover:text-blue-500"
            >
              support@rowflow.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}