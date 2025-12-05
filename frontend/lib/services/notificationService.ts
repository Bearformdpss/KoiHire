import { apiRequest } from '@/lib/api'

interface Notification {
  id: string
  type: 'NEW_APPLICATION' | 'APPLICATION_ACCEPTED' | 'APPLICATION_REJECTED' | 'PROJECT_UPDATE' | 'SUBMISSION_RECEIVED' | 'WORK_APPROVED' | 'CHANGES_REQUESTED' | 'PAYMENT_RELEASED' | 'PROJECT_COMPLETED' | 'PROJECT_CANCELLED' | 'message' | 'system'
  title: string
  message: string
  isRead: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  readAt?: string
  projectId?: string
  applicationId?: string
  updateId?: string
  data?: any
  project?: {
    id: string
    title: string
  }
  application?: {
    id: string
    coverLetter: string
  }
  update?: {
    id: string
    title: string
    type: string
  }
  // For backward compatibility with existing components
  read: boolean
  actionUrl?: string
  metadata?: {
    projectId?: string
    applicationId?: string
    conversationId?: string
    userId?: string
    amount?: number
    messageId?: string
  }
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await apiRequest.get<{ data: any[] }>('/notifications')
      
      // Transform backend notifications to match frontend interface
      const notifications = response.data.map((notification: any) => ({
        ...notification,
        read: notification.isRead, // Map isRead to read for compatibility
        type: this.mapNotificationType(notification.type),
        actionUrl: this.getActionUrl(notification)
      }))
      
      return notifications
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      return []
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiRequest.patch(`/notifications/${notificationId}/read`)
      
      // Dispatch custom event to update UI components
      window.dispatchEvent(new Event('notificationUpdate'))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiRequest.patch('/notifications/mark-all-read')
      
      // Dispatch custom event to update UI components
      window.dispatchEvent(new Event('notificationUpdate'))
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiRequest.get<{ data: { count: number } }>('/notifications/unread-count')
      return response.data.count
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiRequest.delete(`/notifications/${notificationId}`)
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  private mapNotificationType(backendType: string): string {
    // Map backend notification types to frontend display types
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

  private getActionUrl(notification: any): string | undefined {
    const type = notification.type

    // NO ROUTING for these notification types (display only)
    if (['APPLICATION_REJECTED', 'SERVICE_ORDER_CANCELLED', 'PROJECT_CANCELLED'].includes(type)) {
      return undefined
    }

    // Service Order notifications → /orders/${orderId}
    if (type.startsWith('SERVICE_ORDER_') && notification.data?.orderId) {
      return `/orders/${notification.data.orderId}`
    }

    // NEW_APPLICATION → /projects/${projectId}/applications
    if (type === 'NEW_APPLICATION' && notification.projectId) {
      return `/projects/${notification.projectId}/applications`
    }

    // All other project notifications → /projects/${projectId}
    if (notification.projectId) {
      return `/projects/${notification.projectId}`
    }

    return undefined
  }
}

export const notificationService = new NotificationService()
export type { Notification }