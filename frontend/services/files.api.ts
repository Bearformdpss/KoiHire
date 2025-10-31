import api from '@/lib/api'

export const filesApi = {
  uploadFiles: async (projectId: string, formData: FormData) => {
    const response = await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getFiles: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/files`)
    return response.data
  },

  downloadFile: async (fileId: string) => {
    // Backend now returns signed S3 URL instead of blob
    const response = await api.get(`/files/download/${fileId}`)
    return response.data.data // Returns { downloadUrl, fileName }
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/files/${fileId}`)
    return response.data
  }
}
