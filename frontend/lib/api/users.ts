import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Users API calls
export const usersApi = {
  // Get current user profile
  getProfile: async () => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/users/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData: {
    firstName?: string
    lastName?: string
    bio?: string
    location?: string
    website?: string
    phone?: string
  }) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.put(`${API_URL}/users/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get user by ID (public profile)
  getUser: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/public/${userId}`)
    return response.data
  },

  // Get user by username (public profile)
  getUserByUsername: async (username: string) => {
    const response = await axios.get(`${API_URL}/users/public/username/${username}`)
    return response.data
  },

  // Update user skills
  updateSkills: async (skills: Array<{
    skillId: string
    level?: string
    yearsExp?: number
  }>) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(`${API_URL}/users/skills`, { skills }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get user statistics
  getUserStats: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/public/${userId}/stats`)
    return response.data
  },

  // Get monthly stats (freelancer only)
  getMonthlyStats: async () => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/users/stats/monthly`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get level progress (freelancer only)
  getLevelProgress: async () => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/users/level-progress`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Update availability status
  updateAvailability: async (isAvailable: boolean) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.patch(`${API_URL}/users/availability`,
      { isAvailable },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  }
}