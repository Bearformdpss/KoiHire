import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Categories API calls
export const categoriesApi = {
  // Get all categories
  getCategories: async () => {
    const response = await axios.get(`${API_URL}/categories`)
    return response.data
  },

  // Get category by slug
  getCategory: async (slug: string) => {
    const response = await axios.get(`${API_URL}/categories/${slug}`)
    return response.data
  },

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
  }
}