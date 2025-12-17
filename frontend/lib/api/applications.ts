import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Applications API calls
export const applicationsApi = {
  // Get applications for a project (clients only)
  getProjectApplications: async (projectId: string, status?: string) => {
    const params = status ? `?status=${status}` : ''
    const response = await axios.get(`${API_URL}/applications/project/${projectId}${params}`, { withCredentials: true }
    })
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

    const response = await axios.get(`${API_URL}/applications/my-applications?${searchParams}`, { withCredentials: true }
    })
    return response.data
  },

  // Submit application to project (freelancers only)
  submitApplication: async (projectId: string, applicationData: {
    coverLetter: string
    proposedBudget?: number
    timeline: string
  }) => {
    const response = await axios.post(`${API_URL}/applications/${projectId}`, applicationData, { withCredentials: true }
    })
    return response.data
  },

  // Update application (freelancers only)
  updateApplication: async (applicationId: string, applicationData: {
    coverLetter?: string
    proposedBudget?: number
    timeline?: string
  }) => {
    const response = await axios.put(`${API_URL}/applications/${applicationId}`, applicationData, { withCredentials: true }
    })
    return response.data
  },

  // Withdraw application (freelancers only)
  withdrawApplication: async (applicationId: string) => {
    const response = await axios.delete(`${API_URL}/applications/${applicationId}`, { withCredentials: true }
    })
    return response.data
  },

  // Get application by ID
  getApplication: async (applicationId: string) => {
    const response = await axios.get(`${API_URL}/applications/${applicationId}`, { withCredentials: true }
    })
    return response.data
  },

  // Check if user has applied to a specific project (freelancers only)
  checkApplicationStatus: async (projectId: string) => {
    const response = await axios.get(`${API_URL}/applications/check/${projectId}`, { withCredentials: true }
    })
    return response.data
  },

  // Batch check if user has applied to multiple projects (freelancers only)
  checkApplicationStatusBatch: async (projectIds: string[]) => {
    const response = await axios.post(`${API_URL}/applications/check-batch`, { projectIds }, { withCredentials: true }
    })
    return response.data
  }
}