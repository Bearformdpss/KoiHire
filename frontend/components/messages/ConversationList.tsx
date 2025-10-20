'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Clock, Search, Loader2, User, Archive, Pin, MoreVertical, ArchiveRestore } from 'lucide-react'
import { messagesApi } from '@/lib/api/messages'
import { socketService } from '@/lib/services/socketService'
import { useAuthStore } from '@/lib/store/authStore'
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
  messages: Array<{
    id: string
    content: string
    createdAt: string
    sender: {
      id: string
      username: string
      firstName: string
      lastName: string
    }
  }>
}

interface ConversationListProps {
  selectedConversationId?: string
  onSelectConversation: (conversation: Conversation) => void
}

export function ConversationList({ selectedConversationId, onSelectConversation }: ConversationListProps) {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived' | 'pinned'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchConversations()
  }, [filter])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      console.log('[ConversationList] Fetching conversations with filter:', filter)
      const response = await messagesApi.getConversations(filter === 'all' ? undefined : filter)
      console.log('[ConversationList] Response:', response)
      if (response.success) {
        console.log('[ConversationList] Setting conversations:', response.conversations)
        setConversations(response.conversations || [])
      } else {
        console.error('[ConversationList] Response not successful')
      }
    } catch (error) {
      console.error('[ConversationList] Failed to fetch conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (conversationId: string, isArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionLoading(conversationId)
    try {
      const response = await messagesApi.archiveConversation(conversationId, isArchived)
      if (response.success) {
        toast.success(isArchived ? 'Conversation archived' : 'Conversation unarchived')
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error)
      toast.error('Failed to archive conversation')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePin = async (conversationId: string, isPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionLoading(conversationId)
    try {
      const response = await messagesApi.pinConversation(conversationId, isPinned)
      if (response.success) {
        toast.success(isPinned ? 'Conversation pinned' : 'Conversation unpinned')
        fetchConversations()
      }
    } catch (error: any) {
      console.error('Failed to pin conversation:', error)
      toast.error(error.response?.data?.message || 'Failed to pin conversation')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredConversations = conversations.filter(conv => 
    conv.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participants.some(p => 
      p.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24

    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 2) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const isUserOnline = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false
    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60)
    return diffInMinutes < 5 // Online if active within last 5 minutes
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.user.id !== user?.id)?.user
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading conversations...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === 'pinned'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Pin className="w-3 h-3" />
            Pinned
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === 'archived'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Archive className="w-3 h-3" />
            Archived
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations</h3>
            <p className="text-gray-600 text-center">
              {searchTerm ? 'No conversations match your search.' : 'Start a conversation when you work on a project with a client or freelancer.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              const lastMessage = conversation.messages[0]
              const isSelected = selectedConversationId === conversation.id
              const isOnline = isUserOnline(otherParticipant?.lastActiveAt)
              const hasUnread = conversation.hasUnread || conversation.unreadCount > 0

              // Get context name (project or service)
              const contextName = conversation.project?.title ||
                                  conversation.serviceOrder?.service.title ||
                                  'Direct conversation'

              return (
                <div
                  key={conversation.id}
                  className={`w-full group relative ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-600' : ''
                  } ${hasUnread ? 'bg-blue-50/30' : ''}`}
                >
                  <button
                    onClick={() => onSelectConversation(conversation)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Unread Indicator Dot */}
                      {hasUnread && !isSelected && (
                        <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}

                      {/* Pin Indicator */}
                      {conversation.isPinned && (
                        <div className="absolute left-1 top-2">
                          <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />
                        </div>
                      )}

                      {/* Avatar with Online Status */}
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          {otherParticipant?.avatar ? (
                            <img
                              src={otherParticipant.avatar}
                              alt={otherParticipant.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        {/* Online Status Indicator */}
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                            {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </span>
                            )}
                            <span className={`text-xs flex items-center ${hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                              {formatTime(conversation.updatedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Project/Service Name */}
                        <p className={`text-xs mb-1 truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                          {contextName}
                        </p>

                        {/* Message Preview */}
                        {(conversation.messagePreview || lastMessage) && (
                          <p className={`text-xs truncate ${hasUnread ? 'text-gray-700 font-semibold' : 'text-gray-500'}`}>
                            {conversation.messagePreview || (
                              <>
                                <span className="font-medium">
                                  {lastMessage.sender.id === user?.id ? 'You' : lastMessage.sender.firstName}:
                                </span>
                                {' '}
                                {lastMessage.content}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Action Buttons (Show on hover) */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white shadow-md rounded-lg p-1 border border-gray-200">
                    {filter !== 'pinned' && (
                      <button
                        onClick={(e) => handlePin(conversation.id, !conversation.isPinned, e)}
                        disabled={actionLoading === conversation.id}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title={conversation.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className={`w-4 h-4 ${conversation.isPinned ? 'text-blue-600 fill-blue-600' : 'text-gray-600'}`} />
                      </button>
                    )}
                    {filter === 'archived' ? (
                      <button
                        onClick={(e) => handleArchive(conversation.id, false, e)}
                        disabled={actionLoading === conversation.id}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Unarchive"
                      >
                        <ArchiveRestore className="w-4 h-4 text-gray-600" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleArchive(conversation.id, true, e)}
                        disabled={actionLoading === conversation.id}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}