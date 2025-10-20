import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Messages API calls
export const messagesApi = {
  // Get user conversations
  getConversations: async (filter?: 'all' | 'unread' | 'archived' | 'pinned') => {
    const token = localStorage.getItem('accessToken')
    const params = filter ? `?filter=${filter}` : ''
    const response = await axios.get(`${API_URL}/messages/conversations${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(`${API_URL}/messages/conversations/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  },

  // Get messages for conversation
  getMessages: async (conversationId: string, params: {
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
      `${API_URL}/messages/conversations/${conversationId}/messages?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Create conversation for project
  createConversation: async (projectId: string, participantId?: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      `${API_URL}/messages/conversations`,
      { 
        projectId,
        ...(participantId && { participantId })
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Create direct conversation (for portfolio contacts, etc.)
  createDirectConversation: async (participantId: string, context?: any) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      `${API_URL}/messages/conversations/direct`,
      { 
        participantId,
        ...(context && { context })
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Send message (HTTP fallback)
  sendMessage: async (conversationId: string, data: {
    content: string
    type?: string
    attachments?: string[]
  }) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Archive/Unarchive conversation
  archiveConversation: async (conversationId: string, isArchived: boolean) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.patch(
      `${API_URL}/messages/conversations/${conversationId}/archive`,
      { isArchived },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Pin/Unpin conversation
  pinConversation: async (conversationId: string, isPinned: boolean) => {
    const token = localStorage.getItem('accessToken')
    const response = await axios.patch(
      `${API_URL}/messages/conversations/${conversationId}/pin`,
      { isPinned },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Upload files
  uploadFiles: async (files: File[], onProgress?: (progress: number) => void) => {
    const token = localStorage.getItem('accessToken')
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await axios.post(
      `${API_URL}/messages/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type - axios will set it automatically with correct boundary
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      }
    )
    return response.data
  }
}