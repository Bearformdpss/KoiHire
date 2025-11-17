import apiClient from './client'

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
