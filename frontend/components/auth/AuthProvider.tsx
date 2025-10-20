'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
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
      // Initialize auth store from localStorage
      initialize();
      
      // If user is authenticated but tokens might be expired, try to refresh
      const storedAuth = localStorage.getItem('refreshToken');
      if (storedAuth && !isAuthenticated) {
        try {
          await useAuthStore.getState().refreshTokens();
        } catch (error) {
          // Refresh failed, tokens will be cleared by the refreshTokens method
          console.log('Token refresh failed during initialization');
        }
      }
      
      setIsInitialized(true);
    };

    initializeAuth();
  }, [initialize, isAuthenticated]);

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