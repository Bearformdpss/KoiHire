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

export interface ServicePackage {
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM'
  title: string
  description: string
  price: number
  deliveryTime: number
  revisions: number
  features: string[]
}

export interface ServiceFAQ {
  question: string
  answer: string
}

export interface CreateServiceData {
  title: string
  description: string
  shortDescription?: string
  categoryId: string
  subcategoryId: string
  basePrice: number
  deliveryTime: number
  revisions: number
  requirements?: string
  coverImage?: string
  galleryImages?: string[]
  videoUrl?: string
  tags?: string[]
  packages: ServicePackage[]
  faqs?: ServiceFAQ[]
  featured?: boolean
  featuredLevel?: 'NONE' | 'BASIC' | 'PREMIUM' | 'SPOTLIGHT'
  featuredPrice?: number
}

export interface Service {
  id: string
  title: string
  description: string
  shortDescription?: string
  categoryId: string
  basePrice: number
  deliveryTime: number
  revisions: number
  requirements?: string
  coverImage?: string
  galleryImages: string[]
  videoUrl?: string
  tags: string[]
  isActive: boolean
  views: number
  orders: number
  rating?: number
  isFeatured: boolean
  featuredUntil?: string
  featuredLevel: string
  createdAt: string
  updatedAt: string
  freelancer: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
    rating?: number
    location?: string
  }
  category: {
    id: string
    name: string
    slug: string
  }
  packages: ServicePackage[]
  reviews?: Array<{
    id: string
    rating: number
    comment?: string
    client: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
    createdAt: string
  }>
  faqs?: ServiceFAQ[]
  _count: {
    serviceOrders: number
    reviews: number
  }
}

export interface ServiceFilters {
  page?: number
  limit?: number
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: 'newest' | 'oldest' | 'price-high' | 'price-low' | 'rating' | 'orders' | 'title'
  order?: 'asc' | 'desc'
  featured?: boolean
  featuredLevel?: 'BASIC' | 'PREMIUM' | 'SPOTLIGHT'
  deliveryTime?: number
  rating?: number
}

export const servicesApi = {
  // Public browsing
  async getServices(filters: ServiceFilters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','))
        } else {
          params.append(key, value.toString())
        }
      }
    })

    return apiClient.get(`/services?${params.toString()}`)
  },

  async getFeaturedServices(featuredLevel?: string, limit?: number) {
    const params = new URLSearchParams()
    if (featuredLevel) params.append('featuredLevel', featuredLevel)
    if (limit) params.append('limit', limit.toString())

    return apiClient.get(`/services/featured?${params.toString()}`)
  },

  async getService(serviceId: string) {
    return apiClient.get(`/services/${serviceId}`)
  },

  async getUserServices(userId: string, filters: {
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  } = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return apiClient.get(`/services/user/${userId}?${params.toString()}`)
  },

  async getServiceReviews(serviceId: string, filters: {
    page?: number
    limit?: number
    rating?: number
    sortBy?: string
    order?: string
  } = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    return apiClient.get(`/services/${serviceId}/reviews?${params.toString()}`)
  },

  // Freelancer management
  async getMyServices(filters: {
    page?: number
    limit?: number
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE'
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

    return apiClient.get(`/services/my-services?${params.toString()}`)
  },

  async createService(data: CreateServiceData) {
    return apiClient.post('/services', data)
  },

  async updateService(serviceId: string, data: Partial<CreateServiceData>) {
    return apiClient.put(`/services/${serviceId}`, data)
  },

  async toggleServiceStatus(serviceId: string) {
    return apiClient.patch(`/services/${serviceId}/toggle-status`)
  },

  async featureService(serviceId: string, data: {
    featuredLevel: 'BASIC' | 'PREMIUM' | 'SPOTLIGHT'
    duration?: number
  }) {
    return apiClient.post(`/services/${serviceId}/feature`, data)
  },

  async deleteService(serviceId: string) {
    return apiClient.delete(`/services/${serviceId}`)
  }
}

export default servicesApi