import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authApi, getStoredAuth, storeAuth, clearAuth } from '@/lib/auth';
import { sessionManager } from '@/lib/sessionManager';

interface AuthState {
  user: User | null;
  tokenExpiresAt: number | null;
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
      tokenExpiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { user, expiresAt } = response;

          storeAuth({ user, expiresAt });
          set({
            user,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });

          // Verify cookies were set correctly after login (proactive stale cookie detection)
          try {
            const cookieCheck = await authApi.verifyCookies();
            if (cookieCheck.cleared) {
              // Stale cookies were detected and cleared, force re-login
              console.warn('[Auth] Stale cookies detected after login, forcing logout...');
              await get().logout();
              throw new Error('Session expired - please login again');
            }
            if (!cookieCheck.cookies.accessToken || !cookieCheck.cookies.refreshToken) {
              console.error('[Auth] Cookies not set after login - cross-origin issue detected');
              throw new Error('Authentication failed - cookies not set. Please check browser settings.');
            }
          } catch (verifyError: any) {
            // If verification fails, logout and throw error
            if (verifyError.message.includes('Session expired') || verifyError.message.includes('cookies not set')) {
              throw verifyError;
            }
            console.error('[Auth] Cookie verification failed:', verifyError);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, expiresAt } = response;

          storeAuth({ user, expiresAt });
          set({
            user,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          clearAuth();
          set({
            user: null,
            tokenExpiresAt: null,
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
        if (storedAuth && storedAuth.user && storedAuth.tokenExpiresAt) {
          storeAuth({
            user: { ...storedAuth.user, ...updates },
            expiresAt: storedAuth.tokenExpiresAt
          });
        }
      },

      refreshTokens: async () => {
        try {
          const response = await authApi.refreshToken();
          const { expiresAt } = response;

          // Update localStorage
          localStorage.setItem('tokenExpiresAt', expiresAt.toString());

          // Notify session manager of token refresh
          if (sessionManager.isActive()) {
            sessionManager.notifyTokenRefresh();
          }

          // Update store
          set((state) => ({
            ...state,
            tokenExpiresAt: expiresAt,
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
            tokenExpiresAt: storedAuth.tokenExpiresAt,
            isAuthenticated: true,
          });
        }

        // Listen for token refresh events
        if (typeof window !== 'undefined') {
          const handleTokenRefresh = (event: CustomEvent) => {
            const { expiresAt } = event.detail;
            set((state) => ({
              ...state,
              tokenExpiresAt: expiresAt,
            }));
          };

          const handleTokenExpired = () => {
            clearAuth();
            set({
              user: null,
              tokenExpiresAt: null,
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
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);