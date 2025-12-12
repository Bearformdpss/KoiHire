'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useMessagesStore } from '@/lib/store/messagesStore';
import { authApi } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { InactivityWarning } from './InactivityWarning';

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ isInitialized: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { initialize, isAuthenticated, user } = useAuthStore();
  const { showWarning, timeRemaining, handleStayLoggedIn, handleLogout } = useSessionMonitor();
  const fetchUnreadCount = useMessagesStore((state) => state.fetchUnreadCount);

  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize auth store from localStorage (for immediate render)
      initialize();

      // OPTIMIZATION: Removed automatic profile fetch on every page load
      // User data from localStorage is sufficient for display
      // Fresh data will be fetched only when:
      // 1. User logs in (handled by login flow)
      // 2. User explicitly refreshes on Settings page
      // 3. After critical actions like Stripe Connect setup
      // This reduces API calls by 1 per page load for authenticated users

      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  // OPTIMIZATION: Fetch unread messages only once on app initialization
  // Previous implementation fetched on every page load via Header component
  // Now we fetch once here and store in global state
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      fetchUnreadCount();
    }
  }, [isInitialized, isAuthenticated, user, fetchUnreadCount]);

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
      <InactivityWarning
        isOpen={showWarning}
        timeRemaining={timeRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
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