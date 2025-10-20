import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(`${API_URL}/reviews`, reviewData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get reviews for a user
  getUserReviews: async (userId: string, params: {
    type?: 'RECEIVED' | 'GIVEN'
    page?: number
    limit?: number
  } = {}) => {
    const token = localStorage.getItem('accessToken')
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await axios.get(
      `${API_URL}/reviews/user/${userId}?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Get review statistics for a user
  getUserReviewStats: async (userId: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/reviews/user/${userId}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get pending reviews for current user
  getPendingReviews: async () => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/reviews/pending`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Mark a review as helpful
  markHelpful: async (reviewId: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      `${API_URL}/reviews/${reviewId}/helpful`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Report a review
  reportReview: async (reviewId: string, reason: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      `${API_URL}/reviews/${reviewId}/report`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  }
}