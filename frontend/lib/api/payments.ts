import { api as apiClient } from '@/lib/api'

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
  },

  // Payment intent endpoints - uses secure cookie-based auth
  createProjectPaymentIntent: async (projectId: string) => {
    const response = await apiClient.post('/payments/project/create-payment-intent', { projectId })
    return response.data
  },

  createServiceOrderPaymentIntent: async (orderId: string) => {
    const response = await apiClient.post('/payments/service-order/create-payment-intent', { orderId })
    return response.data
  }
}
