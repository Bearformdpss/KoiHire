'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'

interface RoleProtectionProps {
  children: React.ReactNode
  allowedRoles: ('CLIENT' | 'FREELANCER')[]
  fallbackPath?: string
}

export function RoleProtection({ children, allowedRoles, fallbackPath = '/dashboard' }: RoleProtectionProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (user && !allowedRoles.includes(user.role as 'CLIENT' | 'FREELANCER')) {
        router.push(fallbackPath)
        return
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, fallbackPath, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or wrong role
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role as 'CLIENT' | 'FREELANCER'))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Specific role protection components for convenience
export function FreelancerOnly({ children }: { children: React.ReactNode }) {
  return <RoleProtection allowedRoles={['FREELANCER']}>{children}</RoleProtection>
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  return <RoleProtection allowedRoles={['CLIENT']}>{children}</RoleProtection>
}