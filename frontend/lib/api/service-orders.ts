import axios from 'axios'
import { apiCall, withRetry } from '@/lib/utils/apiErrorHandler'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Configure axios instance with cookie-based authentication
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  withCredentials: true, // Send httpOnly cookies with requests
})

// No need for Authorization header interceptor - cookies are sent automatically
// No need for 401 interceptor - main api.ts handles token refresh

export interface ServiceOrder {
  id: string
  serviceId: string
  packageId: string
  clientId: string
  freelancerId: string
  orderNumber: string
  packagePrice: number
  buyerFee: number
  sellerCommission: number
  totalAmount: number
  requirements?: string
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'REVISION_REQUESTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  paymentStatus: 'PENDING' | 'PAID' | 'RELEASED' | 'REFUNDED'
  deliveryDate?: string
  deliveredAt?: string
  revisionsUsed: number
  conversationId?: string
  createdAt: string
  updatedAt: string
  service: {
    id: string
    title: string
    coverImage?: string
    category: {
      name: string
    }
  }
  package: {
    id: string
    tier: string
    title: string
    description: string
    price: number
    deliveryTime: number
    revisions: number
    features: string[]
  }
  client: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    rating?: number
  }
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    rating?: number
  }
  conversation?: {
    id: string
  }
  deliverables?: Array<{
    id: string
    title: string
    description?: string
    files: string[]
    submittedAt: string
    status: 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED'
    revisionNote?: string
  }>
  reviews?: Array<{
    id: string
    rating: number
    comment?: string
    createdAt: string
  }>
  transactions?: Array<{
    id: string
    type: string
    amount: number
    status: string
    createdAt: string
  }>
}

export interface CreateOrderData {
  packageId: string
  requirements?: string
}

export interface DeliveryData {
  title: string
  description?: string
  files?: string[]
}

export interface ReviewData {
  rating: number
  comment?: string
  communication?: number
  quality?: number
  delivery?: number
  value?: number
}

export const serviceOrdersApi = {
  // Get user orders (role-based)
  async getOrders(filters: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    order?: string
  } = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return apiClient.get(`/service-orders?${params.toString()}`)
  },

  // Get freelancer orders (alias for getOrders)
  async getFreelancerOrders(filters: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    order?: string
  } = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return apiClient.get(`/service-orders?${params.toString()}`)
  },

  // Get client/my orders (alias for getOrders)
  async getMyOrders(filters: {
    page?: number
    limit?: number
    status?: string
    search?: string
    sortBy?: string
    order?: string
  } = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return apiClient.get(`/service-orders?${params.toString()}`)
  },

  // Get specific order details
  async getOrder(orderId: string) {
    return apiClient.get(`/service-orders/${orderId}`)
  },

  // Place order (clients only)
  async placeOrder(serviceId: string, data: CreateOrderData) {
    return apiClient.post(`/service-orders/${serviceId}/order`, data)
  },

  // Accept order (freelancer only)
  async acceptOrder(orderId: string) {
    return apiClient.post(`/service-orders/${orderId}/accept`)
  },

  // Start work on order (freelancer only)
  async startOrder(orderId: string) {
    return apiClient.post(`/service-orders/${orderId}/start`)
  },

  // Start work on order (alias for startOrder)
  async startWork(orderId: string) {
    return apiClient.post(`/service-orders/${orderId}/start`)
  },

  // Submit delivery (freelancer only)
  async submitDelivery(orderId: string, data: DeliveryData) {
    return apiClient.post(`/service-orders/${orderId}/deliver`, data)
  },

  // Submit deliverable (alias for submitDelivery)
  async submitDeliverable(orderId: string, data: DeliveryData) {
    return apiClient.post(`/service-orders/${orderId}/deliver`, data)
  },

  // Approve delivery (client only)
  async approveDelivery(orderId: string) {
    return apiClient.post(`/service-orders/${orderId}/approve`)
  },

  // Request revision (client only)
  async requestRevision(orderId: string, revisionNote: string) {
    return apiClient.post(`/service-orders/${orderId}/revision`, { revisionNote })
  },

  // Cancel order
  async cancelOrder(orderId: string, reason?: string) {
    return apiClient.post(`/service-orders/${orderId}/cancel`, { reason })
  },

  // Submit review (client only)
  async submitReview(orderId: string, data: ReviewData) {
    return apiClient.post(`/service-orders/${orderId}/review`, data)
  }
}

export default serviceOrdersApi