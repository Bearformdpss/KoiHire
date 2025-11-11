'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { authApi } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ isInitialized: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { initialize, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize auth store from localStorage (for immediate render)
      initialize();

      // If user is authenticated, fetch fresh data from server
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Fetch fresh user data from server to get latest Stripe Connect status
          const { user: freshUser } = await authApi.getProfile();

          // Update store with fresh data (overwrites localStorage)
          useAuthStore.getState().updateUser(freshUser);

          console.log('✅ User data refreshed from server');
        } catch (error) {
          console.log('⚠️ Failed to fetch fresh user data, using cached data');

          // If fetch fails, try token refresh as fallback
          const storedRefreshToken = localStorage.getItem('refreshToken');
          if (storedRefreshToken) {
            try {
              await useAuthStore.getState().refreshTokens();
            } catch (refreshError) {
              console.log('Token refresh also failed during initialization');
            }
          }
        }
      }

      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // Show loading spinner while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}