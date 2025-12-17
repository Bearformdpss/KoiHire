import { api } from '../api'

// Upload API calls - uses secure cookie-based auth
export const uploadApi = {
  // Upload deliverable files (for project and service order submissions)
  uploadDeliverables: async (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/upload/deliverables', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}
