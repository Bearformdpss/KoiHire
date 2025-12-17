import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { tokenRefreshManager } from './tokenRefreshManager';
import { sessionManager } from './sessionManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests (for httpOnly cookie auth)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor removed - cookies are sent automatically with withCredentials: true

// Response interceptor to handle token refresh with lock mechanism
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // First, try clearing stale cookies (for migration from old cookie format)
      if (!originalRequest._cookiesCleared) {
        originalRequest._cookiesCleared = true;
        try {
          await axios.post(`${API_URL}/auth/clear-cookies`, {}, {
            withCredentials: true,
          });
          console.log('[Auth] Cleared stale cookies, attempting token refresh...');
        } catch (clearError) {
          console.error('[Auth] Failed to clear cookies:', clearError);
        }
      }

      try {
        // Use token refresh manager to prevent concurrent refreshes
        // Cookies are sent automatically with withCredentials: true
        const refreshResult = await tokenRefreshManager.refresh(async () => {
          const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            withCredentials: true, // Send refresh token cookie
          });
          return response.data;
        });

        const { expiresAt } = refreshResult;

        // Store expiry time for session manager
        if (typeof window !== 'undefined') {
          localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        }

        // Notify session manager of token refresh
        if (sessionManager.isActive()) {
          sessionManager.notifyTokenRefresh();
        }

        // Update auth store if available
        if (typeof window !== 'undefined') {
          // Trigger a custom event to notify the auth store
          window.dispatchEvent(new CustomEvent('token-refresh', {
            detail: { expiresAt }
          }));
        }

        // Try the original request again (new cookie sent automatically)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiresAt');

        // Trigger logout event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('token-expired'));
        }

        // Only redirect if we're not already on the login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API helper functions
export const apiRequest = {
  get: async <T>(url: string, config = {}) => {
    try {
      const response = await api.get<{ success: boolean; data?: T } & T>(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  post: async <T>(url: string, data = {}, config = {}) => {
    try {
      const response = await api.post<{ success: boolean; data?: T } & T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  put: async <T>(url: string, data = {}, config = {}) => {
    try {
      const response = await api.put<{ success: boolean; data?: T } & T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  patch: async <T>(url: string, data = {}, config = {}) => {
    try {
      const response = await api.patch<{ success: boolean; data?: T } & T>(url, data, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  delete: async <T>(url: string, config = {}) => {
    try {
      const response = await api.delete<{ success: boolean; data?: T } & T>(url, config);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};

function handleApiError(error: any) {
  if (error.response?.data?.message) {
    toast.error(error.response.data.message);
  } else if (error.message) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}

export default api;