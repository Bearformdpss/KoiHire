import { api } from '../api'
import { apiCall, withRetry } from '@/lib/utils/apiErrorHandler'

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

        const response = await api.get(`/projects?${searchParams}`)
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
        const response = await api.get(`/projects/${projectId}`)
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
        const response = await api.post('/projects', projectData)
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
        const response = await api.put(`/projects/${projectId}`, projectData)
        return response.data
      },
      { retry: false }
    )
  },

  // Accept application
  acceptApplication: async (projectId: string, applicationId: string) => {
    return apiCall(
      async () => {
        const response = await api.post(`/projects/${projectId}/accept/${applicationId}`, {})
        return response.data
      },
      { retry: false }
    )
  },

  // Complete project
  completeProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.post(`/projects/${projectId}/complete`, {})
        return response.data
      },
      { retry: false }
    )
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.delete(`/projects/${projectId}`)
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

        const response = await api.get(`/projects/my-projects?${searchParams}`)
        return response.data
      },
      { retry: { maxRetries: 2, retryDelay: 1000 } }
    )
  },

  // Get project applications (for client)
  getProjectApplications: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.get(`/projects/${projectId}/applications`)
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
        const response = await api.post('/projects/search', filters)
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
        const response = await api.post(`/projects/${projectId}/pause`)
        return response.data
      },
      { retry: false }
    )
  },

  cancelProject: async (projectId: string, reason?: string) => {
    return apiCall(
      async () => {
        const response = await api.post(`/projects/${projectId}/cancel`, { reason })
        return response.data
      },
      { retry: false }
    )
  },

  updateTimeline: async (projectId: string, timeline: string, reason?: string) => {
    return apiCall(
      async () => {
        const response = await api.put(`/projects/${projectId}/timeline`, { timeline, reason })
        return response.data
      },
      { retry: false }
    )
  },

  updateBudget: async (projectId: string, minBudget: number, maxBudget: number, reason?: string) => {
    return apiCall(
      async () => {
        const response = await api.put(`/projects/${projectId}/budget`, { minBudget, maxBudget, reason })
        return response.data
      },
      { retry: false }
    )
  },

  submitForReview: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.put(`/projects/${projectId}/submit-for-review`)
        return response.data
      },
      { retry: false }
    )
  },

  // Submit work with details (freelancer only) - NEW Enhanced Endpoint
  submitWork: async (projectId: string, data: { title: string; description?: string; files?: string[] }) => {
    return apiCall(
      async () => {
        const response = await api.put(`/projects/${projectId}/submit-work`, data)
        return response.data
      },
      { retry: false }
    )
  },

  // Get current submission for a project
  getCurrentSubmission: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.get(`/projects/${projectId}/submission/current`)
        return response.data
      },
      { retry: { maxRetries: 2, retryDelay: 500 } }
    )
  },

  // Approve project (client only)
  approveProject: async (projectId: string) => {
    return apiCall(
      async () => {
        const response = await api.post(`/projects/${projectId}/approve`)
        return response.data
      },
      { retry: false }
    )
  },

  // Request changes (client only)
  requestChanges: async (projectId: string, message: string) => {
    return apiCall(
      async () => {
        const response = await api.post(`/projects/${projectId}/request-changes`, { message })
        return response.data
      },
      { retry: false }
    )
  },

}