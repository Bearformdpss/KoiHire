'use client';

import { AuthRequired } from '@/components/auth/ProtectedRoute';
import { ClientDashboardNew } from '@/components/dashboard/ClientDashboardNew';
import { FreelancerDashboard } from '@/components/dashboard/FreelancerDashboard';
import { useAuthStore } from '@/lib/store/authStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthRequired>
      {user?.role === 'CLIENT' ? <ClientDashboardNew /> : <FreelancerDashboard />}
    </AuthRequired>
  );
}