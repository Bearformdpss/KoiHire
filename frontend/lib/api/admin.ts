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
};
