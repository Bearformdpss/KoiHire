const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003';

// API client with auth headers
const apiClient = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// ==================== DASHBOARD ====================

export const adminApi = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await apiClient(`${API_URL}/admin/dashboard/stats`);
    return response.json();
  },

  // ==================== TRANSACTIONS ====================

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_URL}/admin/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  // ==================== ESCROWS ====================

  getEscrows: async (params?: {
    status?: string;
    projectId?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.projectId) queryParams.append('projectId', params.projectId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_URL}/admin/escrows${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  releaseEscrow: async (escrowId: string, reason?: string) => {
    const response = await apiClient(`${API_URL}/admin/escrow/${escrowId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  refundEscrow: async (escrowId: string, reason: string) => {
    const response = await apiClient(`${API_URL}/admin/escrow/${escrowId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  // ==================== PROJECTS ====================

  getProjects: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    hasEscrow?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.hasEscrow !== undefined) queryParams.append('hasEscrow', params.hasEscrow.toString());

    const url = `${API_URL}/admin/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  getProject: async (projectId: string) => {
    const response = await apiClient(`${API_URL}/admin/projects/${projectId}`);
    return response.json();
  },

  updateProjectStatus: async (projectId: string, status: string, reason?: string) => {
    const response = await apiClient(`${API_URL}/admin/projects/${projectId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    return response.json();
  },

  // ==================== USERS ====================

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isVerified?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());

    const url = `${API_URL}/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  getUser: async (userId: string) => {
    const response = await apiClient(`${API_URL}/admin/users/${userId}`);
    return response.json();
  },

  updateUserStatus: async (userId: string, data: { isVerified?: boolean; isAvailable?: boolean }) => {
    const response = await apiClient(`${API_URL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // ==================== SERVICE ORDERS ====================

  getServiceOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_URL}/admin/service-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  getServiceOrder: async (orderId: string) => {
    const response = await apiClient(`${API_URL}/admin/service-orders/${orderId}`);
    return response.json();
  },

  releaseServiceOrderPayment: async (orderId: string, reason?: string) => {
    const response = await apiClient(`${API_URL}/admin/service-orders/${orderId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  refundServiceOrder: async (orderId: string, reason: string) => {
    const response = await apiClient(`${API_URL}/admin/service-orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return response.json();
  },

  // ==================== PAYOUTS ====================

  getPayouts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    payoutMethod?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.payoutMethod) queryParams.append('payoutMethod', params.payoutMethod);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_URL}/admin/payouts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  processPayoutStart: async (payoutId: string, adminNotes?: string) => {
    const response = await apiClient(`${API_URL}/admin/payouts/${payoutId}/process`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes })
    });
    return response.json();
  },

  completePayoutManually: async (payoutId: string, data: { externalReference?: string; adminNotes?: string }) => {
    const response = await apiClient(`${API_URL}/admin/payouts/${payoutId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  failPayout: async (payoutId: string, data: { failureReason: string; adminNotes?: string }) => {
    const response = await apiClient(`${API_URL}/admin/payouts/${payoutId}/fail`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // ==================== USER PROFILE MANAGEMENT ====================

  updateUserProfile: async (userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    payoutMethod?: string | null;
    paypalEmail?: string | null;
    payoneerEmail?: string | null;
  }) => {
    const response = await apiClient(`${API_URL}/admin/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await apiClient(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return response.json();
  },

  // ==================== SERVICES ====================

  getServices: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    search?: string;
    featured?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());

    const url = `${API_URL}/admin/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },

  getService: async (serviceId: string) => {
    const response = await apiClient(`${API_URL}/admin/services/${serviceId}`);
    return response.json();
  },

  updateServiceStatus: async (serviceId: string, isActive: boolean) => {
    const response = await apiClient(`${API_URL}/admin/services/${serviceId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    return response.json();
  },

  unfeatureService: async (serviceId: string) => {
    const response = await apiClient(`${API_URL}/admin/services/${serviceId}/unfeature`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  // ==================== ACTIVITY LOGS ====================

  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
    adminId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.targetType) queryParams.append('targetType', params.targetType);
    if (params?.adminId) queryParams.append('adminId', params.adminId);

    const url = `${API_URL}/admin/activity-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient(url);
    return response.json();
  },
};
