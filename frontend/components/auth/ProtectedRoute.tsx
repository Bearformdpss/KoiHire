'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // If authentication is required but user is not authenticated
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // If specific role is required but user doesn't have it
      if (requireAuth && isAuthenticated && requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = user?.role === 'CLIENT' ? '/dashboard' : '/dashboard';
        router.push(dashboardPath);
        return;
      }

      // If user is authenticated but trying to access auth pages (login/register)
      if (!requireAuth && isAuthenticated) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, requireAuth, requiredRole, isLoading, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If specific role is required but user doesn't have it, don't render children
  if (requireAuth && isAuthenticated && requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // If user is authenticated but trying to access auth pages, don't render children
  if (!requireAuth && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

// Convenience components for specific use cases
export function AuthRequired({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth'>) {
  return (
    <ProtectedRoute requireAuth={true} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function GuestOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth'>) {
  return (
    <ProtectedRoute requireAuth={false} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function ClientOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredRole'>) {
  return (
    <ProtectedRoute requireAuth={true} requiredRole="CLIENT" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function FreelancerOnly({ children, ...props }: Omit<ProtectedRouteProps, 'requireAuth' | 'requiredRole'>) {
  return (
    <ProtectedRoute requireAuth={true} requiredRole="FREELANCER" {...props}>
      {children}
    </ProtectedRoute>
  );
}