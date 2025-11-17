import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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

export interface RecommendedProject {
  id: string
  title: string
  description: string
  category: {
    id: string
    name: string
  }
  minBudget: number
  maxBudget: number
  client: {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
  }
  createdAt: string
  applicationsCount: number
  matchReason: string
}

export interface RecommendationsResponse {
  success: boolean
  data: {
    projects: RecommendedProject[]
    matchedSkills: string[]
    totalMatches: number
  }
}

export const recommendationsApi = {
  /**
   * Get recommended projects for the current user
   * @param limit - Number of projects to return (default: 6)
   */
  async getRecommendedProjects(limit: number = 6): Promise<RecommendationsResponse> {
    return apiClient.get(`/recommendations/projects?limit=${limit}`)
  }
}
