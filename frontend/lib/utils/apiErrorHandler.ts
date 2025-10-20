import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

export interface ApiError {
  message: string
  status: number
  code?: string
  details?: any
  timestamp: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

// Network status checking
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
}

// Sleep utility for retry delays
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

// Enhanced error handler
export class ApiErrorHandler {
  static handleError(error: unknown, showToast = true): ApiError {
    const timestamp = new Date().toISOString()
    
    // Handle Axios errors
    if (error instanceof AxiosError) {
      const status = error.response?.status || 0
      const serverMessage = error.response?.data?.message || error.response?.data?.error
      
      let message: string
      let code: string | undefined
      
      switch (status) {
        case 400:
          message = serverMessage || 'Invalid request. Please check your input.'
          code = 'BAD_REQUEST'
          break
        case 401:
          message = 'Session expired. Please log in again.'
          code = 'UNAUTHORIZED'
          // Automatically redirect to login for auth errors
          if (typeof window !== 'undefined') {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
          break
        case 403:
          message = 'Access denied. You don\'t have permission to perform this action.'
          code = 'FORBIDDEN'
          break
        case 404:
          message = serverMessage || 'The requested resource was not found.'
          code = 'NOT_FOUND'
          break
        case 409:
          message = serverMessage || 'A conflict occurred. The resource may already exist.'
          code = 'CONFLICT'
          break
        case 429:
          message = 'Too many requests. Please wait a moment and try again.'
          code = 'RATE_LIMITED'
          break
        case 500:
          message = 'Internal server error. Our team has been notified.'
          code = 'INTERNAL_SERVER_ERROR'
          break
        case 502:
        case 503:
        case 504:
          message = 'Server temporarily unavailable. Please try again later.'
          code = 'SERVER_UNAVAILABLE'
          break
        default:
          if (!isOnline()) {
            message = 'No internet connection. Please check your network.'
            code = 'OFFLINE'
          } else if (error.code === 'ECONNABORTED') {
            message = 'Request timeout. Please try again.'
            code = 'TIMEOUT'
          } else {
            message = serverMessage || 'An unexpected error occurred.'
            code = 'UNKNOWN'
          }
      }

      const apiError: ApiError = {
        message,
        status,
        code,
        details: error.response?.data,
        timestamp
      }

      if (showToast) {
        this.showErrorToast(apiError)
      }

      // Log error for monitoring
      this.logError(apiError, error)

      return apiError
    }

    // Handle network errors
    if (error instanceof Error) {
      const apiError: ApiError = {
        message: error.message || 'An unexpected error occurred.',
        status: 0,
        code: 'NETWORK_ERROR',
        timestamp
      }

      if (showToast && error.message !== 'Request timeout') {
        this.showErrorToast(apiError)
      }

      this.logError(apiError, error)
      return apiError
    }

    // Handle unknown errors
    const apiError: ApiError = {
      message: 'An unknown error occurred.',
      status: 0,
      code: 'UNKNOWN',
      details: error,
      timestamp
    }

    if (showToast) {
      this.showErrorToast(apiError)
    }

    this.logError(apiError, error)
    return apiError
  }

  private static showErrorToast(error: ApiError) {
    // Don't show toast for certain error types
    if (error.code === 'UNAUTHORIZED' || error.status === 401) {
      return
    }

    toast.error(error.message, {
      duration: error.status >= 500 ? 6000 : 4000,
      style: {
        maxWidth: '400px'
      }
    })
  }

  private static logError(apiError: ApiError, originalError: unknown) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', apiError, originalError)
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logToExternalService(apiError, originalError)
    }
  }

  private static logToExternalService(apiError: ApiError, originalError: unknown) {
    // In a real application, send to error monitoring service
    try {
      const errorReport = {
        ...apiError,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        originalError: originalError instanceof Error ? {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack
        } : originalError
      }
      
      // Example: Send to Sentry, LogRocket, or custom endpoint
      console.log('Would log to external service:', errorReport)
    } catch (loggingError) {
      console.error('Failed to log error to external service:', loggingError)
    }
  }
}

// Retry mechanism for API calls
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config }
  let lastError: unknown

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Check network status before attempting
      if (!isOnline()) {
        throw new Error('No internet connection')
      }

      const result = await apiCall()
      return result
    } catch (error) {
      lastError = error
      
      // Don't retry on certain error types
      if (error instanceof AxiosError) {
        const status = error.response?.status
        if (status && !finalConfig.retryableStatusCodes.includes(status)) {
          throw error
        }
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        throw error
      }

      // Calculate delay with exponential backoff
      const delay = finalConfig.retryDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1)
      
      console.log(`API call failed (attempt ${attempt}/${finalConfig.maxRetries}), retrying in ${delay}ms...`)
      
      await sleep(delay)
    }
  }

  throw lastError
}

// Wrapper for making API calls with error handling and retries
export async function apiCall<T>(
  operation: () => Promise<T>,
  options: {
    showErrorToast?: boolean
    retry?: boolean | Partial<RetryConfig>
  } = {}
): Promise<ApiResponse<T>> {
  const { showErrorToast = true, retry = true } = options

  try {
    let result: T

    if (retry) {
      const retryConfig = typeof retry === 'boolean' ? {} : retry
      result = await withRetry(operation, retryConfig)
    } else {
      result = await operation()
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    const apiError = ApiErrorHandler.handleError(error, showErrorToast)
    return {
      success: false,
      error: apiError,
      message: apiError.message
    }
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Array<(isOnline: boolean) => void> = []

  static initialize() {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      this.notifyListeners(true)
      toast.success('Connection restored', {
        icon: '🟢',
        duration: 3000
      })
    }

    const handleOffline = () => {
      this.notifyListeners(false)
      toast.error('Connection lost. Some features may not work.', {
        icon: '🔴',
        duration: 0 // Don't auto-dismiss
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  static addListener(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback)
  }

  static removeListener(callback: (isOnline: boolean) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback)
  }

  private static notifyListeners(isOnline: boolean) {
    this.listeners.forEach(listener => listener(isOnline))
  }
}

// Hook for using network status in React components
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  React.useEffect(() => {
    const updateNetworkStatus = (online: boolean) => setIsOnline(online)
    NetworkMonitor.addListener(updateNetworkStatus)
    
    return () => NetworkMonitor.removeListener(updateNetworkStatus)
  }, [])

  return isOnline
}

// Add React import for the hook
import React from 'react'