import { apiRequest } from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  isVerified: boolean;
  isAvailable?: boolean;
  rating?: number;
  totalEarnings: number;
  totalSpent: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'CLIENT' | 'FREELANCER';
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiRequest.post<AuthResponse>('/auth/login', credentials);
    return response;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiRequest.post<AuthResponse>('/auth/register', credentials);
    return response;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiRequest.post('/auth/logout', { refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiRequest.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    });
    return response;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await apiRequest.get<{ user: User }>('/users/profile');
    return response;
  },

  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await apiRequest.put<{ user: User }>('/users/profile', data);
    return response;
  },
};

export const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userString = localStorage.getItem('user');
  
  if (!accessToken || !refreshToken || !userString) {
    return null;
  }

  try {
    const user = JSON.parse(userString);
    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
};

export const storeAuth = (data: { accessToken: string; refreshToken: string; user: User }) => {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
};

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};