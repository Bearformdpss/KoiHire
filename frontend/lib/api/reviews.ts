import { api } from '../api'

// Reviews API calls
export const reviewsApi = {
  // Create a new review
  createReview: async (reviewData: {
    projectId: string
    revieweeId: string
    rating: number
    comment: string
    communication: number
    quality: number
    timeliness: number
    professionalism: number
  }) => {
    const response = await api.post('/reviews', reviewData)
    return response.data
  },

  // Get reviews for a user
  getUserReviews: async (userId: string, params: {
    type?: 'RECEIVED' | 'GIVEN'
    page?: number
    limit?: number
  } = {}) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await api.get(`/reviews/user/${userId}?${searchParams}`)
    return response.data
  },

  // Get review statistics for a user
  getUserReviewStats: async (userId: string) => {
    const response = await api.get(`/reviews/user/${userId}/stats`)
    return response.data
  },

  // Get pending reviews for current user
  getPendingReviews: async () => {
    const response = await api.get('/reviews/pending')
    return response.data
  },

  // Mark a review as helpful
  markHelpful: async (reviewId: string) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`, {})
    return response.data
  },

  // Report a review
  reportReview: async (reviewId: string, reason: string) => {
    const response = await api.post(`/reviews/${reviewId}/report`, { reason })
    return response.data
  }
}