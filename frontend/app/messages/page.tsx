'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { ConversationList } from '@/components/messages/ConversationList'
import { ChatInterface } from '@/components/messages/ChatInterface'
import { socketService } from '@/lib/services/socketService'
import { useAuthStore } from '@/lib/store/authStore'
import { messagesApi } from '@/lib/api/messages'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'
import { MessageCircle, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Conversation {
  id: string
  projectId: string
  unreadCount: number
  hasUnread: boolean
  messagePreview: string | null
  updatedAt: string
  isArchived?: boolean
  isPinned?: boolean
  pinnedAt?: string | null
  project?: {
    id: string
    title: string
    status: string
    client?: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
    freelancer?: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  serviceOrder?: {
    id: string
    orderNumber: string
    status: string
    service: {
      id: string
      title: string
    }
  }
  participants: Array<{
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatar?: string
      lastActiveAt?: string
    }
  }>
}

export default function MessagesPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const { refresh: refreshUnreadCount } = useUnreadMessages()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [conversationListKey, setConversationListKey] = useState(0)

  useEffect(() => {
    // For now, we'll use HTTP fallback for messaging instead of Socket.IO
    // Set connected to true to enable messaging functionality
    setIsConnected(true)
  }, [])

  // Handle URL parameters for creating conversations or selecting existing ones
  useEffect(() => {
    const userId = searchParams?.get('user')
    const projectId = searchParams?.get('project')
    const contactUserId = searchParams?.get('contact')
    const portfolioId = searchParams?.get('portfolio')
    const conversationId = searchParams?.get('conversationId')

    if (conversationId && user) {
      // If a conversation ID is provided, fetch and select it
      handleSelectConversationById(conversationId)
    } else if (userId && projectId && user) {
      handleCreateBidConversation(projectId, userId)
    } else if (contactUserId && user) {
      handleCreatePortfolioContact(contactUserId, portfolioId)
    }
  }, [searchParams, user])

  const handleCreateBidConversation = async (projectId: string, participantId: string) => {
    try {
      setCreatingConversation(true)
      const response = await messagesApi.createConversation(projectId, participantId)
      
      if (response.success) {
        // Auto-select this conversation
        setSelectedConversation(response.conversation)
        toast.success('Conversation ready!')
      }
    } catch (error) {
      console.error('Error creating bid conversation:', error)
      toast.error('Failed to start conversation')
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleCreatePortfolioContact = async (participantId: string, portfolioId?: string) => {
    try {
      setCreatingConversation(true)
      const context = portfolioId ? { portfolioId } : undefined
      const response = await messagesApi.createDirectConversation(participantId, context)
      
      if (response.success) {
        // Auto-select this conversation
        setSelectedConversation(response.conversation)
        if (response.message === 'Direct conversation already exists') {
          toast.success('Conversation found!')
        } else {
          toast.success('Ready to chat!')
        }
      }
    } catch (error) {
      console.error('Error creating portfolio contact conversation:', error)
      toast.error('Failed to start conversation')
    } finally {
      setCreatingConversation(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    // Refresh unread count when user opens a conversation
    setTimeout(() => refreshUnreadCount(), 1000)
  }

  const handleSelectConversationById = async (conversationId: string) => {
    try {
      setCreatingConversation(true)
      console.log('[Messages] Fetching conversation by ID:', conversationId)
      const response = await messagesApi.getConversation(conversationId)
      console.log('[Messages] Raw response:', response)

      // Handle different response structures
      const conversation = response.conversation || response.data?.conversation || response.data
      console.log('[Messages] Parsed conversation:', conversation)

      if (conversation && conversation.id) {
        setSelectedConversation(conversation)
        console.log('[Messages] Set selected conversation, triggering list refresh')
        // Refresh unread count
        setTimeout(() => refreshUnreadCount(), 1000)
        // Trigger conversation list refresh by incrementing key (delayed to ensure conversation is loaded)
        setTimeout(() => {
          console.log('[Messages] Incrementing conversation list key to force refresh')
          setConversationListKey(prev => prev + 1)
        }, 100)
      } else {
        console.error('[Messages] Conversation not found in response')
        toast.error('Conversation not found')
      }
    } catch (error) {
      console.error('[Messages] Error loading conversation:', error)
      toast.error('Failed to load conversation')
    } finally {
      setCreatingConversation(false)
    }
  }

  return (
    <AuthRequired>
      <div className="bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="h-full max-w-7xl mx-auto">
          <div className="flex h-full">
            {/* Conversation List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 bg-white overflow-y-auto">
              <ConversationList
                key={conversationListKey}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
              />
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col h-full">
              {creatingConversation ? (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Starting conversation...</h3>
                    <p className="text-gray-600 max-w-sm">
                      Creating a conversation for this project. Please wait a moment.
                    </p>
                  </div>
                </div>
              ) : selectedConversation ? (
                <ChatInterface conversation={selectedConversation} />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600 max-w-sm">
                      Choose a conversation from the sidebar to start messaging with your clients or freelancers.
                    </p>
                    {!isConnected && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-orange-600">
                        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                        <span className="text-sm">Connecting to chat server...</span>
                      </div>
                    )}
                    {isConnected && (
                      <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm">Connected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthRequired>
  )
}