'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { socketService } from '@/lib/services/socketService'
import { notificationService } from '@/lib/services/notificationService'

export function NotificationButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const updateUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount()
        setUnreadCount(count)
      } catch (error) {
        console.error('Failed to get unread count:', error)
      }
    }
    
    updateUnreadCount()

    // Listen for new messages/notifications via Socket.IO
    const unsubscribeMessage = socketService.onMessage(() => {
      setUnreadCount(prev => prev + 1)
    })

    // Listen for real-time notifications
    const unsubscribeNotifications = socketService.onNotification((notification) => {
      console.log('📧 Real-time notification received in button:', notification)
      setUnreadCount(prev => prev + 1)
    })

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      updateUnreadCount()
    }
    window.addEventListener('notificationUpdate', handleNotificationUpdate)

    return () => {
      unsubscribeMessage()
      unsubscribeNotifications()
      window.removeEventListener('notificationUpdate', handleNotificationUpdate)
    }
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    // Optionally reduce unread count when opened
    // setUnreadCount(0)
  }

  const handleMarkAllAsRead = () => {
    setUnreadCount(0)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="relative text-white hover:text-gray-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </>
  )
}