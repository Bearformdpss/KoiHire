'use client'

import { useState, useEffect } from 'react'
import { AuthRequired } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  MessageCircle, 
  Briefcase, 
  DollarSign, 
  Star, 
  CheckCircle,
  X,
  Filter,
  Calendar,
  Clock,
  Trash2
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'MESSAGE' | 'PROJECT_UPDATE' | 'PAYMENT' | 'REVIEW' | 'APPLICATION' | 'MILESTONE'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: {
    projectId?: string
    messageId?: string
    userId?: string
    amount?: number
  }
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | Notification['type']>('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [filter, typeFilter])

  const fetchNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/notifications')
      // const allNotifications = await response.json()
      
      // Apply filters
      let filteredNotifications: Notification[] = []

      if (filter === 'UNREAD') {
        filteredNotifications = filteredNotifications.filter(n => !n.isRead)
      } else if (filter === 'READ') {
        filteredNotifications = filteredNotifications.filter(n => n.isRead)
      }

      if (typeFilter !== 'ALL') {
        filteredNotifications = filteredNotifications.filter(n => n.type === typeFilter)
      }

      setNotifications(filteredNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case 'PROJECT_UPDATE':
        return <Briefcase className="w-5 h-5 text-green-500" />
      case 'PAYMENT':
        return <DollarSign className="w-5 h-5 text-green-600" />
      case 'REVIEW':
        return <Star className="w-5 h-5 text-yellow-500" />
      case 'APPLICATION':
        return <Briefcase className="w-5 h-5 text-purple-500" />
      case 'MILESTONE':
        return <CheckCircle className="w-5 h-5 text-blue-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <AuthRequired>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-3xl">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-20" />
            ))}
          </div>
        </div>
      </AuthRequired>
    )
  }

  return (
    <AuthRequired>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600">
                Stay updated with your latest activities and messages
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} unread
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Notifications</option>
                    <option value="UNREAD">Unread Only</option>
                    <option value="READ">Read Only</option>
                  </select>
                </div>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="MESSAGE">Messages</option>
                  <option value="PROJECT_UPDATE">Project Updates</option>
                  <option value="PAYMENT">Payments</option>
                  <option value="REVIEW">Reviews</option>
                  <option value="APPLICATION">Applications</option>
                  <option value="MILESTONE">Milestones</option>
                </select>
              </div>
              
              <span className="text-sm text-gray-600">
                {notifications.length} notifications
              </span>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {filter === 'UNREAD' 
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."
                  }
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow cursor-pointer ${
                    !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {notifications.length > 0 && (
            <div className="text-center mt-8">
              <Button variant="outline">
                Load More Notifications
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthRequired>
  )
}