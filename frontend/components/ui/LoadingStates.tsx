'use client'

import React from 'react'
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Loading spinner variants
interface LoadingSpinnerProps {
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'secondary' | 'white'
  className?: string
}

export function LoadingSpinner({ 
  size = 'default', 
  variant = 'default', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
    icon: 'w-12 h-12'
  }

  const variantClasses = {
    default: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  }

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    />
  )
}

// Inline loading state
interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'default'
}

export function InlineLoading({ text = 'Loading...', size = 'default' }: InlineLoadingProps) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size={size} />
      <span className={`${size === 'sm' ? 'text-sm' : 'text-base'} text-gray-600`}>
        {text}
      </span>
    </div>
  )
}

// Full page loading
interface PageLoadingProps {
  title?: string
  message?: string
  showLogo?: boolean
}

export function PageLoading({ 
  title = 'Loading...', 
  message, 
  showLogo = true 
}: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        {showLogo && (
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
            R
          </div>
        )}
        
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        
        {message && (
          <p className="text-gray-600 max-w-sm">{message}</p>
        )}
      </div>
    </div>
  )
}

// Card/Section loading skeleton
interface SkeletonProps {
  className?: string
  animate?: boolean
}

export function Skeleton({ className = '', animate = true }: SkeletonProps) {
  return (
    <div 
      className={`bg-gray-200 rounded ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  )
}

// Common skeleton patterns
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="animate-pulse">
        <Skeleton className="h-4 bg-gray-300 rounded w-3/4 mb-3" />
        <Skeleton className="h-3 bg-gray-300 rounded w-1/2 mb-4" />
        
        <div className="space-y-2">
          <Skeleton className="h-3 bg-gray-300 rounded" />
          <Skeleton className="h-3 bg-gray-300 rounded w-5/6" />
          <Skeleton className="h-3 bg-gray-300 rounded w-4/6" />
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Skeleton className="h-8 w-8 bg-gray-300 rounded-full" />
          <Skeleton className="h-3 bg-gray-300 rounded w-24" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 bg-gray-300 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 bg-gray-300 rounded w-3/4" />
              <Skeleton className="h-3 bg-gray-300 rounded w-1/2" />
              <Skeleton className="h-3 bg-gray-300 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 bg-gray-300 rounded" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-3 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Loading state with retry
interface LoadingWithRetryProps {
  loading: boolean
  error?: string
  onRetry: () => void
  children: React.ReactNode
  loadingText?: string
  emptyText?: string
  showEmpty?: boolean
}

export function LoadingWithRetry({
  loading,
  error,
  onRetry,
  children,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  showEmpty = false
}: LoadingWithRetryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <InlineLoading text={loadingText} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load</h3>
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">{error}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (showEmpty) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wifi className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data</h3>
        <p className="text-gray-600">{emptyText}</p>
      </div>
    )
  }

  return <>{children}</>
}

// Button loading states
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <Button 
      {...props}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'cursor-not-allowed' : ''}`}
    >
      {loading && <LoadingSpinner size="sm" variant="white" className="mr-2" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  )
}

// Async content wrapper
interface AsyncContentProps<T> {
  data: T | null | undefined
  loading: boolean
  error?: string | null
  children: (data: T) => React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  onRetry?: () => void
}

export function AsyncContent<T>({
  data,
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry
}: AsyncContentProps<T>) {
  if (loading) {
    return loadingComponent || <InlineLoading />
  }

  if (error) {
    if (errorComponent) return errorComponent
    
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (!data) {
    return emptyComponent || <div className="text-center py-8 text-gray-500">No data available</div>
  }

  return <>{children(data)}</>
}

// Progressive loading indicator
interface ProgressiveLoadingProps {
  steps: Array<{
    id: string
    label: string
    completed: boolean
    loading: boolean
  }>
  currentStep?: string
}

export function ProgressiveLoading({ steps, currentStep }: ProgressiveLoadingProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center space-x-3">
          {step.completed ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : step.loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full" />
          )}
          
          <span className={`text-sm ${
            step.completed ? 'text-green-600' : 
            step.loading ? 'text-blue-600' : 
            'text-gray-500'
          }`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}