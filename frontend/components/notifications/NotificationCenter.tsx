'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Bell,
  X,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  DollarSign,
  Star
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { socketService } from '@/lib/services/socketService'
import { notificationService, type Notification } from '@/lib/services/notificationService'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onMarkAllAsRead?: () => void
}

export function NotificationCenter({ isOpen, onClose, onMarkAllAsRead }: NotificationCenterProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    // Listen for real-time notifications via Socket.IO
    const unsubscribeMessage = socketService.onMessage((message) => {
      const notification: Notification = {
        id: `msg-${message.id}`,
        type: 'message',
        title: 'New Message',
        message: `New message from ${message.sender.firstName} ${message.sender.lastName}`,
        read: false,
        isRead: false,
        priority: 'NORMAL',
        createdAt: message.createdAt,
        actionUrl: '/messages',
        metadata: {
          conversationId: message.conversationId
        }
      }
      
      setNotifications(prev => [notification, ...prev])
    })

    // Listen for real-time notifications
    const unsubscribeNotifications = socketService.onNotification((notification) => {
      console.log('📧 Real-time notification received in center:', notification)
      
      const transformedNotification: Notification = {
        ...notification,
        read: notification.isRead,
        type: mapNotificationType(notification.type),
        actionUrl: getActionUrl(notification)
      }
      
      setNotifications(prev => [transformedNotification, ...prev])
    })

    return () => {
      unsubscribeMessage()
      unsubscribeNotifications()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const notifications = await notificationService.getNotifications()
      setNotifications(notifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Immediately update the parent component's unread count
      onMarkAllAsRead?.()
      
      await notificationService.markAllAsRead()
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId)
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'application':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'project':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'system':
        return <Info className="w-5 h-5 text-gray-500" />
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'milestone':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const mapNotificationType = (backendType: string): string => {
    const typeMap: Record<string, string> = {
      'NEW_APPLICATION': 'application',
      'APPLICATION_ACCEPTED': 'application',
      'APPLICATION_REJECTED': 'application',
      'PROJECT_UPDATE': 'project',
      'SUBMISSION_RECEIVED': 'project',
      'WORK_APPROVED': 'project',
      'CHANGES_REQUESTED': 'project',
      'PAYMENT_RELEASED': 'payment',
      'PROJECT_COMPLETED': 'project',
      'PROJECT_CANCELLED': 'project'
    }
    
    return typeMap[backendType] || 'system'
  }

  const getActionUrl = (notification: any): string | undefined => {
    if (notification.projectId) {
      return `/projects/${notification.projectId}`
    }
    if (notification.applicationId) {
      return `/applications/${notification.applicationId}`
    }
    return undefined
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex sm:pl-16">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-4 py-6 bg-gray-50 sm:px-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-600">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 h-7 flex items-center">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                {unreadCount > 0 && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all as read
                    </Button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-gray-600">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <Bell className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-600 text-center">
                      You're all caught up! New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium truncate ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              
                              <div className="flex items-center space-x-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-blue-600 hover:text-blue-500"
                                    title="Mark as read"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Delete"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true 
                              })}
                            </p>
                            
                            {notification.actionUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-blue-600 hover:text-blue-500 p-0 h-auto font-normal"
                                onClick={() => {
                                  router.push(notification.actionUrl!)
                                  markAsRead(notification.id)
                                  onClose()
                                }}
                              >
                                View Details →
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}