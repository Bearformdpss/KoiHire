import api from '@/lib/api'

export const serviceOrderFilesApi = {
  uploadFiles: async (orderId: string, formData: FormData) => {
    const response = await api.post(`/service-orders/${orderId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getFiles: async (orderId: string) => {
    const response = await api.get(`/service-orders/${orderId}/files`)
    return response.data
  },

  downloadFile: async (fileId: string) => {
    // Backend returns signed S3 URL instead of blob
    const response = await api.get(`/service-order-files/download/${fileId}`)
    return response.data.data // Returns { downloadUrl, fileName }
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/service-order-files/${fileId}`)
    return response.data
  }
}
