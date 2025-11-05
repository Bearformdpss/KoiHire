import apiClient from './client'

export const paymentsApi = {
  // Stripe Connect endpoints
  createConnectAccount: async () => {
    const response = await apiClient.post('/payments/connect/create-account')
    return response.data
  },

  getConnectStatus: async () => {
    const response = await apiClient.get('/payments/connect/status')
    return response.data
  },

  getPendingPayouts: async () => {
    const response = await apiClient.get('/payments/connect/pending-payouts')
    return response.data
  },

  processAccumulatedPayouts: async () => {
    const response = await apiClient.post('/payments/connect/process-pending-payouts')
    return response.data
  }
}
