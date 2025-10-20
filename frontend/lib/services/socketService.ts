import io, { Socket } from 'socket.io-client'

interface Message {
  id: string
  content: string
  type: string
  senderId: string
  conversationId: string
  createdAt: string
  sender: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

interface TypingUser {
  userId: string
  conversationId: string
  isTyping: boolean
}

interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  data?: any
  priority: string
  projectId?: string
  applicationId?: string
  updateId?: string
  createdAt: string
  isRead: boolean
  project?: any
  application?: any
  update?: any
}

class SocketService {
  private socket: Socket | null = null
  private messageCallbacks: ((message: Message) => void)[] = []
  private typingCallbacks: ((data: TypingUser) => void)[] = []
  private notificationCallbacks: ((notification: NotificationData) => void)[] = []
  private connectionCallbacks: (() => void)[] = []
  private errorCallbacks: ((error: any) => void)[] = []

  connect(token: string) {
    if (this.socket) {
      this.socket.disconnect()
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5003'
    console.log('🔌 Attempting to connect to Socket.IO server:', SOCKET_URL)
    console.log('🔑 Using token:', token ? 'Present' : 'Missing')
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['polling', 'websocket'], // Try polling first
      forceNew: true,
      timeout: 20000
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server successfully!')
      this.connectionCallbacks.forEach(cb => cb())
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server, reason:', reason)
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error)
      this.errorCallbacks.forEach(cb => cb(error))
    })

    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error)
      this.errorCallbacks.forEach(cb => cb(error))
    })

    this.socket.on('new_message', (data: { message: Message, conversationId: string }) => {
      this.messageCallbacks.forEach(cb => cb(data.message))
    })

    this.socket.on('user_typing', (data: TypingUser) => {
      this.typingCallbacks.forEach(cb => cb(data))
    })

    this.socket.on('joined_conversation', (data: { conversationId: string }) => {
      console.log('Joined conversation:', data.conversationId)
    })

    this.socket.on('messages_read', (data: { userId: string, conversationId: string, readAt: Date }) => {
      console.log('Messages marked as read:', data)
    })

    this.socket.on('notification', (notification: NotificationData) => {
      console.log('📧 New notification received:', notification)
      this.notificationCallbacks.forEach(cb => cb(notification))
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Join all user conversations
  joinConversations() {
    if (this.socket) {
      this.socket.emit('join_conversations')
    }
  }

  // Join specific conversation
  joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId)
    }
  }

  // Send message
  sendMessage(data: {
    conversationId: string
    content: string
    type?: string
    attachments?: string[]
  }) {
    if (this.socket) {
      this.socket.emit('send_message', data)
    }
  }

  // Typing indicators
  startTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', conversationId)
    }
  }

  stopTyping(conversationId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', conversationId)
    }
  }

  // Mark messages as read
  markMessagesRead(conversationId: string) {
    if (this.socket) {
      this.socket.emit('mark_messages_read', conversationId)
    }
  }

  // Event listeners
  onMessage(callback: (message: Message) => void) {
    this.messageCallbacks.push(callback)
    
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback)
    }
  }

  onTyping(callback: (data: TypingUser) => void) {
    this.typingCallbacks.push(callback)
    
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback)
    }
  }

  onConnect(callback: () => void) {
    this.connectionCallbacks.push(callback)
    
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback)
    }
  }

  onError(callback: (error: any) => void) {
    this.errorCallbacks.push(callback)
    
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback)
    }
  }

  onNotification(callback: (notification: NotificationData) => void) {
    this.notificationCallbacks.push(callback)
    
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()