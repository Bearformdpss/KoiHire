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
  createdAt?: string;
  // Sensitive payment data removed for security - fetch via separate endpoint when needed
}

// Payment settings interface - separate from User for security
// Fetch from /api/users/payment-settings when needed (not included in auth responses)
export interface PaymentSettings {
  stripeConnectAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  stripePayoutsEnabled?: boolean;
  stripeDetailsSubmitted?: boolean;
  stripeChargesEnabled?: boolean;
  payoutMethod?: 'STRIPE' | 'PAYPAL' | 'PAYONEER' | null;
  paypalEmail?: string | null;
  payoneerEmail?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  expiresAt: number; // Token expiry timestamp (for session management)
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

  logout: async (): Promise<void> => {
    await apiRequest.post('/auth/logout', {});
  },

  refreshToken: async (): Promise<{ expiresAt: number }> => {
    const response = await apiRequest.post<{ expiresAt: number }>('/auth/refresh', {});
    return response;
  },

  verifyCookies: async (): Promise<{ success: boolean; cookies: { accessToken: boolean; refreshToken: boolean }; cleared: boolean; message: string }> => {
    const response = await apiRequest.get<{ success: boolean; cookies: { accessToken: boolean; refreshToken: boolean }; cleared: boolean; message: string }>('/auth/verify-cookies');
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

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest.post<{ success: boolean; message: string }>('/auth/forgot-password', {
      email,
    });
    return response;
  },

  validateResetToken: async (token: string): Promise<{ success: boolean; valid: boolean; message: string }> => {
    const response = await apiRequest.get<{ success: boolean; valid: boolean; message: string }>(
      `/auth/reset-password/${token}`
    );
    return response;
  },

  resetPassword: async (
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest.post<{ success: boolean; message: string }>('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response;
  },

  // Get payment settings (requires authentication)
  // This fetches sensitive payment data that was removed from auth/profile responses for security
  getPaymentSettings: async (): Promise<{ success: boolean; paymentSettings: PaymentSettings }> => {
    const response = await apiRequest.get<{ success: boolean; paymentSettings: PaymentSettings }>('/users/payment-settings');
    return response;
  },
};

export const getStoredAuth = () => {
  if (typeof window === 'undefined') return null;

  const userString = localStorage.getItem('user');
  const tokenExpiresAtString = localStorage.getItem('tokenExpiresAt');

  if (!userString) {
    return null;
  }

  try {
    const user = JSON.parse(userString);
    const tokenExpiresAt = tokenExpiresAtString ? parseInt(tokenExpiresAtString, 10) : null;
    return { user, tokenExpiresAt };
  } catch {
    return null;
  }
};

export const storeAuth = (data: { user: User; expiresAt: number }) => {
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
};

export const clearAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiresAt');
};