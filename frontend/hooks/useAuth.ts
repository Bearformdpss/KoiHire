'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on mount and verify cookies
    // This will auto-logout users with invalid/stale cookies
    store.initialize().catch((error) => {
      console.error('[useAuth] Initialization failed:', error);
    });
  }, [store]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateUser: store.updateUser,
  };
}