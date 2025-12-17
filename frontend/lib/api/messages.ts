import { api } from '../api'

// Messages API calls
export const messagesApi = {
  // Get user conversations
  getConversations: async (filter?: 'all' | 'unread' | 'archived' | 'pinned') => {
    const params = filter ? `?filter=${filter}` : ''
    const response = await api.get(`/messages/conversations${params}`)
    return response.data
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    const response = await api.get(`/messages/conversations/${conversationId}`)
    return response.data
  },

  // Get messages for conversation
  getMessages: async (conversationId: string, params: {
    page?: number
    limit?: number
  } = {}) => {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await api.get(`/messages/conversations/${conversationId}/messages?${searchParams}`)
    return response.data
  },

  // Create conversation for project
  createConversation: async (projectId: string, participantId?: string) => {
    const response = await api.post('/messages/conversations', {
      projectId,
      ...(participantId && { participantId })
    })
    return response.data
  },

  // Create direct conversation (for portfolio contacts, etc.)
  createDirectConversation: async (participantId: string, context?: any) => {
    const response = await api.post('/messages/conversations/direct', {
      participantId,
      ...(context && { context })
    })
    return response.data
  },

  // Send message (HTTP fallback)
  sendMessage: async (conversationId: string, data: {
    content: string
    type?: string
    attachments?: string[]
  }) => {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, data)
    return response.data
  },

  // Archive/Unarchive conversation
  archiveConversation: async (conversationId: string, isArchived: boolean) => {
    const response = await api.patch(`/messages/conversations/${conversationId}/archive`, { isArchived })
    return response.data
  },

  // Pin/Unpin conversation
  pinConversation: async (conversationId: string, isPinned: boolean) => {
    const response = await api.patch(`/messages/conversations/${conversationId}/pin`, { isPinned })
    return response.data
  },

  // Upload files
  uploadFiles: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0
        onProgress(progress)
      } : undefined
    })
    return response.data
  }
}