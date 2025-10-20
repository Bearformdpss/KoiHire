import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authApi, getStoredAuth, storeAuth, clearAuth } from '@/lib/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
  refreshTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, accessToken, refreshToken } = response;
          
          storeAuth({ user, accessToken, refreshToken });
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, accessToken, refreshToken } = response;
          
          storeAuth({ user, accessToken, refreshToken });
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch (error) {
          // Ignore logout errors
        } finally {
          clearAuth();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
        const storedAuth = getStoredAuth();
        if (storedAuth && storedAuth.user) {
          storeAuth({ ...storedAuth, user: { ...storedAuth.user, ...updates } });
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refreshToken(refreshToken);
          const { accessToken, refreshToken: newRefreshToken } = response;
          
          // Update localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update store
          set((state) => ({
            ...state,
            accessToken,
            refreshToken: newRefreshToken,
          }));
        } catch (error) {
          // Token refresh failed, logout
          await get().logout();
          throw error;
        }
      },

      initialize: () => {
        const storedAuth = getStoredAuth();
        if (storedAuth) {
          set({
            user: storedAuth.user,
            accessToken: storedAuth.accessToken,
            refreshToken: storedAuth.refreshToken,
            isAuthenticated: true,
          });
        }

        // Listen for token refresh events
        if (typeof window !== 'undefined') {
          const handleTokenRefresh = (event: CustomEvent) => {
            const { accessToken, refreshToken } = event.detail;
            set((state) => ({
              ...state,
              accessToken,
              refreshToken,
            }));
          };

          const handleTokenExpired = () => {
            clearAuth();
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          };

          window.addEventListener('token-refresh', handleTokenRefresh as EventListener);
          window.addEventListener('token-expired', handleTokenExpired);

          // Cleanup function
          return () => {
            window.removeEventListener('token-refresh', handleTokenRefresh as EventListener);
            window.removeEventListener('token-expired', handleTokenExpired);
          };
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);