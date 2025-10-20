import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  responseTime: number
  services: {
    api: boolean
    database: boolean
    authentication: boolean
    payments: boolean
  }
  version?: string
  environment?: string
}

export class HealthCheckService {
  private static instance: HealthCheckService
  private healthStatus: HealthStatus | null = null
  private lastCheck: number = 0
  private checkInterval: NodeJS.Timeout | null = null
  private listeners: Array<(status: HealthStatus) => void> = []

  static getInstance(): HealthCheckService {
    if (!this.instance) {
      this.instance = new HealthCheckService()
    }
    return this.instance
  }

  async checkHealth(force = false): Promise<HealthStatus> {
    const now = Date.now()
    
    // Return cached status if recent (last 30 seconds) and not forced
    if (!force && this.healthStatus && (now - this.lastCheck) < 30000) {
      return this.healthStatus
    }

    const startTime = now

    try {
      const response = await axios.get(`${API_URL}/health`, {
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      const responseTime = Date.now() - startTime
      
      this.healthStatus = {
        status: response.data.status || 'healthy',
        timestamp: now,
        responseTime,
        services: {
          api: true,
          database: response.data.database || false,
          authentication: response.data.auth || false,
          payments: response.data.payments || false
        },
        version: response.data.version,
        environment: response.data.environment
      }

      this.lastCheck = now
      this.notifyListeners(this.healthStatus)
      
      return this.healthStatus

    } catch (error) {
      const responseTime = Date.now() - startTime
      
      this.healthStatus = {
        status: 'unhealthy',
        timestamp: now,
        responseTime,
        services: {
          api: false,
          database: false,
          authentication: false,
          payments: false
        }
      }

      this.lastCheck = now
      this.notifyListeners(this.healthStatus)
      
      return this.healthStatus
    }
  }

  startMonitoring(intervalMs = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Initial check
    this.checkHealth()

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkHealth()
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  addListener(callback: (status: HealthStatus) => void): void {
    this.listeners.push(callback)
  }

  removeListener(callback: (status: HealthStatus) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  private notifyListeners(status: HealthStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Error in health check listener:', error)
      }
    })
  }

  getLastKnownStatus(): HealthStatus | null {
    return this.healthStatus
  }

  isHealthy(): boolean {
    return this.healthStatus?.status === 'healthy'
  }

  getServiceStatus(service: keyof HealthStatus['services']): boolean {
    return this.healthStatus?.services[service] || false
  }
}

// React hook for using health status
export function useHealthStatus() {
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus | null>(null)
  
  React.useEffect(() => {
    const healthService = HealthCheckService.getInstance()
    
    // Get current status
    const currentStatus = healthService.getLastKnownStatus()
    if (currentStatus) {
      setHealthStatus(currentStatus)
    }
    
    // Listen for updates
    const handleStatusUpdate = (status: HealthStatus) => {
      setHealthStatus(status)
    }
    
    healthService.addListener(handleStatusUpdate)
    
    // Start monitoring if not already started
    healthService.startMonitoring()
    
    return () => {
      healthService.removeListener(handleStatusUpdate)
    }
  }, [])
  
  return healthStatus
}

// Simple check if API is reachable
export async function isAPIReachable(): Promise<boolean> {
  try {
    const response = await axios.head(API_URL || '', {
      timeout: 3000
    })
    return response.status >= 200 && response.status < 300
  } catch {
    return false
  }
}

// Initialize health monitoring when service is imported
if (typeof window !== 'undefined') {
  // Only run in browser
  const healthService = HealthCheckService.getInstance()
  healthService.startMonitoring()
}

import React from 'react'