import { api } from '../api'

// Applications API calls
export const applicationsApi = {
  // Get applications for a project (clients only)
  getProjectApplications: async (projectId: string, status?: string) => {
    const params = status ? `?status=${status}` : ''
    const response = await api.get(`/applications/project/${projectId}${params}`)
    return response.data
  },

  // Get freelancer's applications (freelancers only)
  getMyApplications: async (params: {
    status?: string
    page?: number
    limit?: number
  } = {}) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await api.get(`/applications/my-applications?${searchParams}`)
    return response.data
  },

  // Submit application to project (freelancers only)
  submitApplication: async (projectId: string, applicationData: {
    coverLetter: string
    proposedBudget?: number
    timeline: string
  }) => {
    const response = await api.post(`/applications/${projectId}`, applicationData)
    return response.data
  },

  // Update application (freelancers only)
  updateApplication: async (applicationId: string, applicationData: {
    coverLetter?: string
    proposedBudget?: number
    timeline?: string
  }) => {
    const response = await api.put(`/applications/${applicationId}`, applicationData)
    return response.data
  },

  // Withdraw application (freelancers only)
  withdrawApplication: async (applicationId: string) => {
    const response = await api.delete(`/applications/${applicationId}`)
    return response.data
  },

  // Get application by ID
  getApplication: async (applicationId: string) => {
    const response = await api.get(`/applications/${applicationId}`)
    return response.data
  },

  // Check if user has applied to a specific project (freelancers only)
  checkApplicationStatus: async (projectId: string) => {
    const response = await api.get(`/applications/check/${projectId}`)
    return response.data
  },

  // Batch check if user has applied to multiple projects (freelancers only)
  checkApplicationStatusBatch: async (projectIds: string[]) => {
    const response = await api.post(`/applications/check-batch`, { projectIds })
    return response.data
  }
}