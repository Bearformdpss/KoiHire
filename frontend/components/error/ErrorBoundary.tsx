'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, Bugsnag, or LogRocket
    console.error('Production error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReportBug = () => {
    const errorReport = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || 'No stack trace',
      componentStack: this.state.errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Create a mailto link with error details
    const subject = encodeURIComponent(`Bug Report: ${errorReport.message}`)
    const body = encodeURIComponent(`
Error Details:
- Message: ${errorReport.message}
- URL: ${errorReport.url}
- Timestamp: ${errorReport.timestamp}
- Browser: ${errorReport.userAgent}

Stack Trace:
${errorReport.stack}

Component Stack:
${errorReport.componentStack}

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:

    `)

    window.open(`mailto:support@rowflow.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left">
                <h3 className="font-medium text-red-800 mb-1">Error Details (Development)</h3>
                <code className="text-xs text-red-700 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={this.handleRetry} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReportBug}
                  className="flex-1"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specialized error boundaries for different contexts
export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">API Error</h3>
          <p className="text-gray-600 mb-4">
            Failed to connect to our servers. Please check your connection.
          </p>
          <Button onClick={retry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, retry }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Error</h2>
            <p className="text-gray-600 mb-6">
              This page encountered an error and couldn't load properly.
            </p>
            <div className="space-x-3">
              <Button onClick={retry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}