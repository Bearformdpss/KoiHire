'use client';

import { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/sessionManager';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * React hook for session monitoring
 * Manages inactivity warnings and auto-logout
 */
export function useSessionMonitor() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Only initialize session monitoring if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Initialize session manager
    sessionManager.initialize((remainingTime) => {
      setTimeRemaining(remainingTime);
      setShowWarning(true);
    });

    // Cleanup on unmount or logout
    return () => {
      sessionManager.cleanup();
    };
  }, [isAuthenticated]);

  /**
   * Handle "Stay Logged In" button click
   */
  const handleStayLoggedIn = async () => {
    try {
      await sessionManager.handleStayLoggedIn();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      // Let the session manager handle the logout
    }
  };

  /**
   * Handle "Logout" button click
   */
  const handleLogout = async () => {
    setShowWarning(false);
    await logout();
  };

  return {
    showWarning,
    timeRemaining,
    handleStayLoggedIn,
    handleLogout,
  };
}
