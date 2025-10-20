import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Skills API calls
export const skillsApi = {
  // Get all skills
  getSkills: async (params: {
    categoryId?: string
    search?: string
  } = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await axios.get(`${API_URL}/categories/skills/all?${searchParams}`)
    return response.data
  },

  // Get skills by category
  getSkillsByCategory: async (categoryId: string) => {
    const response = await axios.get(`${API_URL}/categories/${categoryId}/skills`)
    return response.data
  },

  // Search skills
  searchSkills: async (query: string) => {
    const response = await axios.get(`${API_URL}/categories/skills/search`, {
      params: { q: query }
    })
    return response.data
  }
}