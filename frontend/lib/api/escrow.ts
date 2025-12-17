import { api } from '../api'

// Escrow API calls - uses secure cookie-based auth
export const escrowApi = {
  // Get escrow status for a project
  getProjectEscrowStatus: async (projectId: string) => {
    const response = await api.get(`/escrow/project/${projectId}`)
    return response.data
  }
}
