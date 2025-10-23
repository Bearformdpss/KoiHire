import axios from 'axios'
import { apiCall, withRetry } from '@/lib/utils/apiErrorHandler'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Configure axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken } = response.data
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken)
          }
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return apiClient.request(error.config)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
        }
      }
    }
    return Promise.reject(error)
  }
)

// Project API calls
export const projectsApi = {
  // Get all projects (marketplace)
  getProjects: async (params: {
    page?: number
    limit?: number
    category?: string
    minBudget?: number
    maxBudget?: number
    search?: string
    sortBy?: string
    order?: 'asc' | 'desc'
    location?: string
    clientRating?: number
    projectLength?: string
    experience?: string
    remote?: boolean
    featured?: boolean
    featuredLevel?: string
  } = {}) => {
    return apiCall(
      async () => {
        const searchParams = new URLSearchParams()
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(','))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })

        const response = await apiClient.get(`/projects?${searchParams}`)
        return response.data
      },
      { 
        retry: { maxRetries: 3, retryDelay: 1000 },
        showErrorToast: false // Let components handle their own error display
      }
    )
  },

  // Get project by ID
  getProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.get(`/projects/${projectId}`)
        return response.data
      },
      { retry: { maxRetries: 2, retryDelay: 500 } }
    )
  },

  // Create new project (clients only)
  createProject: async (projectData: {
    title: string
    description: string
    requirements?: string
    minBudget: number
    maxBudget: number
    timeline: string
    categoryId: string
  }) => {
    return apiCall(
      async () => {
        const response = await apiClient.post('/projects', projectData)
        return response.data
      },
      { retry: false } // Don't retry write operations
    )
  },

  // Update project
  updateProject: async (projectId: string, projectData: {
    title?: string
    description?: string
    requirements?: string
    minBudget?: number
    maxBudget?: number
    timeline?: string
  }) => {
    return apiCall(
      async () => {
        const response = await apiClient.put(`/projects/${projectId}`, projectData)
        return response.data
      },
      { retry: false }
    )
  },

  // Accept application
  acceptApplication: async (projectId: string, applicationId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/accept/${applicationId}`, {})
        return response.data
      },
      { retry: false }
    )
  },

  // Complete project
  completeProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/complete`, {})
        return response.data
      },
      { retry: false }
    )
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.delete(`/projects/${projectId}`)
        return response.data
      },
      { retry: false }
    )
  },

  // Get client's projects
  getMyProjects: async (params: { status?: string; page?: number; limit?: number; search?: string; sortBy?: string; order?: 'asc' | 'desc' } = {}) => {
    return apiCall(
      async () => {
        const searchParams = new URLSearchParams()
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString())
          }
        })

        const response = await apiClient.get(`/projects/my-projects?${searchParams}`)
        return response.data
      },
      { retry: { maxRetries: 2, retryDelay: 1000 } }
    )
  },

  // Get project applications (for client)
  getProjectApplications: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.get(`/projects/${projectId}/applications`)
        return response.data
      },
      { retry: { maxRetries: 2, retryDelay: 500 } }
    )
  },

  // Search projects with advanced filters
  searchProjects: async (filters: {
    query?: string
    categories?: string[]
    budgetMin?: number
    budgetMax?: number
    location?: string
    remote?: boolean
    clientRating?: number
    sortBy?: string
    page?: number
    limit?: number
  }) => {
    return apiCall(
      async () => {
        const response = await apiClient.post('/projects/search', filters)
        return response.data
      },
      { 
        retry: { maxRetries: 3, retryDelay: 1000 },
        showErrorToast: false
      }
    )
  },

  // Project management actions
  pauseResumeProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/pause`)
        return response.data
      },
      { retry: false }
    )
  },

  cancelProject: async (projectId: string, reason?: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/cancel`, { reason })
        return response.data
      },
      { retry: false }
    )
  },

  updateTimeline: async (projectId: string, timeline: string, reason?: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.put(`/projects/${projectId}/timeline`, { timeline, reason })
        return response.data
      },
      { retry: false }
    )
  },

  updateBudget: async (projectId: string, minBudget: number, maxBudget: number, reason?: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.put(`/projects/${projectId}/budget`, { minBudget, maxBudget, reason })
        return response.data
      },
      { retry: false }
    )
  },

  submitForReview: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.put(`/projects/${projectId}/submit-for-review`)
        return response.data
      },
      { retry: false }
    )
  },

  // Approve project (client only)
  approveProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/approve`)
        return response.data
      },
      { retry: false }
    )
  },

  // Request changes (client only)
  requestChanges: async (projectId: string, message: string) => {
    return apiCall(
      async () => {
        const response = await apiClient.post(`/projects/${projectId}/request-changes`, { message })
        return response.data
      },
      { retry: false }
    )
  },

}