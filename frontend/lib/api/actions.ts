import { api } from '../api'

// Actions API calls - uses secure cookie-based auth
export const actionsApi = {
  // Get all actions requiring user attention
  getActions: async () => {
    const response = await api.get('/actions')
    return response.data
  }
}
