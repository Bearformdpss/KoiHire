import { api } from '../api'

// Users API calls
export const usersApi = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/users/dashboard/stats')
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
    const response = await api.put('/users/profile', profileData)
    return response.data
  },

  // Get user by ID (public profile)
  getUser: async (userId: string) => {
    const response = await api.get(`/users/public/${userId}`)
    return response.data
  },

  // Get user by username (public profile)
  getUserByUsername: async (username: string) => {
    const response = await api.get(`/users/public/username/${username}`)
    return response.data
  },

  // Update user skills
  updateSkills: async (skills: Array<{
    skillId: string
    level?: string
    yearsExp?: number
  }>) => {
    const response = await api.post('/users/skills', { skills })
    return response.data
  },

  // Get user statistics
  getUserStats: async (userId: string) => {
    const response = await api.get(`/users/public/${userId}/stats`)
    return response.data
  },

  // Get monthly stats (freelancer only)
  getMonthlyStats: async () => {
    const response = await api.get('/users/stats/monthly')
    return response.data
  },

  // Get level progress (freelancer only)
  getLevelProgress: async () => {
    const response = await api.get('/users/level-progress')
    return response.data
  },

  // Update availability status
  updateAvailability: async (isAvailable: boolean) => {
    const response = await api.patch('/users/availability', { isAvailable })
    return response.data
  },

  // Get payout preferences (freelancers only)
  getPayoutPreferences: async () => {
    const response = await api.get('/users/payout-preferences')
    return response.data
  },

  // Update payout preferences (freelancers only)
  updatePayoutPreferences: async (data: {
    payoutMethod?: 'STRIPE' | 'PAYPAL' | 'PAYONEER' | null
    paypalEmail?: string | null
    payoneerEmail?: string | null
  }) => {
    const response = await api.put('/users/payout-preferences', data)
    return response.data
  }
}