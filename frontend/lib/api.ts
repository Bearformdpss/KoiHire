import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { tokenRefreshManager } from './tokenRefreshManager';
import { sessionManager } from './sessionManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh with lock mechanism
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use token refresh manager to prevent concurrent refreshes
        const refreshResult = await tokenRefreshManager.refresh(async () => {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          return response.data;
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResult;

        // Update localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Notify session manager of token refresh
        if (sessionManager.isActive()) {
          sessionManager.notifyTokenRefresh();
        }

        // Update auth store if available
        if (typeof window !== 'undefined') {
          // Trigger a custom event to notify the auth store
          window.dispatchEvent(new CustomEvent('token-refresh', {
            detail: { accessToken, refreshToken: newRefreshToken }
          }));
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Try the original request again
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

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