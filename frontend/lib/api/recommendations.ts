import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Configure axios instance with cookie-based authentication
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies with requests
})

// No need for Authorization header interceptor - cookies are sent automatically

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
    totalMatches: number
  }
}

export const recommendationsApi = {
  /**
   * Get recommended projects for the current user
   * @param limit - Number of projects to return (default: 6)
   */
  async getRecommendedProjects(limit: number = 6): Promise<RecommendationsResponse> {
    const response = await apiClient.get(`/recommendations/projects?limit=${limit}`)
    return response.data
  }
}
