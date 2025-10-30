import { useState, useEffect } from 'react'
import { messagesApi } from '@/lib/api/messages'
import { useAuthStore } from '@/lib/store/authStore'

export function useUnreadMessages() {
  const { user, isAuthenticated } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchUnreadCount = async () => {
    if (!isAuthenticated || !user) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      const response = await messagesApi.getConversations()
      if (response.success && response.conversations) {
        // Calculate total unread messages across all conversations
        const totalUnread = response.conversations.reduce((total, conv) => {
          return total + (conv.unreadCount || 0)
        }, 0)
        setUnreadCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    // TEMPORARILY DISABLED - causing 429 rate limit errors
    // Set up polling to check for new messages every 30 seconds
    // const interval = setInterval(fetchUnreadCount, 30000)

    // return () => clearInterval(interval)
  }, [isAuthenticated, user])

  const markAsRead = () => {
    setUnreadCount(0)
  }

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
    markAsRead
  }
}