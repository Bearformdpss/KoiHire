import { create } from 'zustand';
import { messagesApi } from '@/lib/api/messages';

interface MessagesState {
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  fetchUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  reset: () => void;
}

export const useMessagesStore = create<MessagesState>()((set, get) => ({
  unreadCount: 0,
  isLoading: false,
  isInitialized: false,

  fetchUnreadCount: async () => {
    // Don't fetch if already loading
    if (get().isLoading) return;

    set({ isLoading: true });
    try {
      const response = await messagesApi.getConversations();
      if (response.success && response.conversations) {
        // Calculate total unread messages across all conversations
        const totalUnread = response.conversations.reduce((total: number, conv: any) => {
          return total + (conv.unreadCount || 0);
        }, 0);
        set({
          unreadCount: totalUnread,
          isLoading: false,
          isInitialized: true
        });
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      set({
        unreadCount: 0,
        isLoading: false,
        isInitialized: true
      });
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  decrementUnreadCount: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  reset: () => {
    set({
      unreadCount: 0,
      isLoading: false,
      isInitialized: false
    });
  },
}));
