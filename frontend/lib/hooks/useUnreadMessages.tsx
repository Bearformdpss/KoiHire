import { useMessagesStore } from '@/lib/store/messagesStore'

// OPTIMIZATION: This hook now uses the global messages store
// Previously, each component using this hook would trigger a separate API call
// Now, the unread count is fetched once in AuthProvider and shared globally
// This reduces API calls from 1 per page to 1 per app session

export function useUnreadMessages() {
  const unreadCount = useMessagesStore((state) => state.unreadCount)
  const isLoading = useMessagesStore((state) => state.isLoading)
  const fetchUnreadCount = useMessagesStore((state) => state.fetchUnreadCount)
  const setUnreadCount = useMessagesStore((state) => state.setUnreadCount)

  const markAsRead = () => {
    setUnreadCount(0)
  }

  return {
    unreadCount,
    loading: isLoading,
    refresh: fetchUnreadCount,
    markAsRead
  }
}