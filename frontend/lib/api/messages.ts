import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Messages API calls
export const messagesApi = {
  // Get user conversations
  getConversations: async (filter?: 'all' | 'unread' | 'archived' | 'pinned') => {
    const params = filter ? `?filter=${filter}` : ''
    const response = await axios.get(`${API_URL}/messages/conversations${params}`, { withCredentials: true }
    })
    return response.data
  },

  // Get conversation by ID
  getConversation: async (conversationId: string) => {
    const response = await axios.get(`${API_URL}/messages/conversations/${conversationId}`, { withCredentials: true }
    })
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

    const response = await axios.get(
      `${API_URL}/messages/conversations/${conversationId}/messages?${searchParams}`,
      {
      }
    )
    return response.data
  },

  // Create conversation for project
  createConversation: async (projectId: string, participantId?: string) => {
    const response = await axios.post(
      `${API_URL}/messages/conversations`,
      { 
        projectId,
        ...(participantId && { participantId })
      },
      {
      }
    )
    return response.data
  },

  // Create direct conversation (for portfolio contacts, etc.)
  createDirectConversation: async (participantId: string, context?: any) => {
    const response = await axios.post(
      `${API_URL}/messages/conversations/direct`,
      { 
        participantId,
        ...(context && { context })
      },
      {
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
    const response = await axios.post(
      `${API_URL}/messages/conversations/${conversationId}/messages`,
      data,
      {
      }
    )
    return response.data
  },

  // Archive/Unarchive conversation
  archiveConversation: async (conversationId: string, isArchived: boolean) => {
    const response = await axios.patch(
      `${API_URL}/messages/conversations/${conversationId}/archive`,
      { isArchived },
      {
      }
    )
    return response.data
  },

  // Pin/Unpin conversation
  pinConversation: async (conversationId: string, isPinned: boolean) => {
    const response = await axios.patch(
      `${API_URL}/messages/conversations/${conversationId}/pin`,
      { isPinned },
      {
      }
    )
    return response.data
  },

  // Upload files
  uploadFiles: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData()

    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await axios.post(
      `${API_URL}/messages/upload`,
      formData,
      {
        }
      }
    )
    return response.data
  }
}