import { PrismaClient, NotificationType, NotificationPriority, Notification } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

export interface NotificationData {
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
  projectId?: string;
  applicationId?: string;
  updateId?: string;
}

export class NotificationService {
  private io?: SocketIOServer;

  constructor(io?: SocketIOServer) {
    this.io = io;
  }

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Send a notification to a single user
   */
  async send(
    userId: string,
    type: NotificationType,
    notificationData: NotificationData
  ): Promise<Notification> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          priority: notificationData.priority || 'NORMAL',
          projectId: notificationData.projectId,
          applicationId: notificationData.applicationId,
          updateId: notificationData.updateId,
        },
        include: {
          project: {
            select: { id: true, title: true }
          },
          application: {
            select: { id: true, coverLetter: true }
          },
          update: {
            select: { id: true, title: true, type: true }
          }
        }
      });

      // Send real-time notification via Socket.IO
      if (this.io) {
        this.sendRealTime(userId, notification);
      }

      console.log(`📧 Notification sent to user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulk(
    userIds: string[],
    type: NotificationType,
    notificationData: NotificationData
  ): Promise<Notification[]> {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.send(userId, type, notificationData))
      );

      console.log(`📧 Bulk notifications sent to ${userIds.length} users: ${type}`);
      return notifications;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via Socket.IO
   */
  private sendRealTime(userId: string, notification: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      projectId: notification.projectId,
      applicationId: notification.applicationId,
      updateId: notification.updateId,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      project: notification.project,
      application: notification.application,
      update: notification.update
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    } = {}
  ) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false })
      },
      include: {
        project: {
          select: { id: true, title: true }
        },
        application: {
          select: { id: true, coverLetter: true }
        },
        update: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId // Ensure user can only mark their own notifications
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return { count: result.count };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<Notification> {
    return await prisma.notification.delete({
      where: {
        id: notificationId,
        userId // Ensure user can only delete their own notifications
      }
    });
  }

  // Specific notification methods for different events

  /**
   * Send notification when freelancer applies to project
   */
  async sendApplicationNotification(
    clientId: string,
    applicationId: string,
    projectId: string,
    freelancerName: string,
    projectTitle: string
  ) {
    return await this.send(clientId, 'NEW_APPLICATION', {
      title: 'New Application Received',
      message: `${freelancerName} applied to your project "${projectTitle}"`,
      priority: 'NORMAL',
      projectId,
      applicationId,
      data: {
        freelancerName,
        projectTitle
      }
    });
  }

  /**
   * Send notification when application is accepted
   */
  async sendApplicationAcceptedNotification(
    freelancerId: string,
    applicationId: string,
    projectId: string,
    projectTitle: string
  ) {
    return await this.send(freelancerId, 'APPLICATION_ACCEPTED', {
      title: 'Application Accepted!',
      message: `Your application for "${projectTitle}" has been accepted`,
      priority: 'HIGH',
      projectId,
      applicationId,
      data: {
        projectTitle
      }
    });
  }

  /**
   * Send notification when application is rejected
   */
  async sendApplicationRejectedNotification(
    freelancerId: string,
    applicationId: string,
    projectId: string,
    projectTitle: string
  ) {
    return await this.send(freelancerId, 'APPLICATION_REJECTED', {
      title: 'Application Update',
      message: `Your application for "${projectTitle}" was not selected this time`,
      priority: 'NORMAL',
      projectId,
      applicationId,
      data: {
        projectTitle
      }
    });
  }

  /**
   * Send notification when project update is created
   */
  async sendProjectUpdateNotification(
    clientId: string,
    updateId: string,
    projectId: string,
    updateTitle: string,
    projectTitle: string,
    freelancerName: string
  ) {
    return await this.send(clientId, 'PROJECT_UPDATE', {
      title: 'Project Update',
      message: `${freelancerName} posted an update for "${projectTitle}": ${updateTitle}`,
      priority: 'NORMAL',
      projectId,
      updateId,
      data: {
        updateTitle,
        projectTitle,
        freelancerName
      }
    });
  }

  /**
   * Send notification when project is submitted for review
   */
  async sendSubmissionReceivedNotification(
    clientId: string,
    projectId: string,
    projectTitle: string,
    freelancerName: string
  ) {
    return await this.send(clientId, 'SUBMISSION_RECEIVED', {
      title: 'Work Submitted for Review',
      message: `${freelancerName} has submitted "${projectTitle}" for your review`,
      priority: 'HIGH',
      projectId,
      data: {
        projectTitle,
        freelancerName
      }
    });
  }

  /**
   * Send notification when work is approved
   */
  async sendWorkApprovedNotification(
    freelancerId: string,
    projectId: string,
    projectTitle: string
  ) {
    return await this.send(freelancerId, 'WORK_APPROVED', {
      title: 'Work Approved!',
      message: `Your work on "${projectTitle}" has been approved`,
      priority: 'HIGH',
      projectId,
      data: {
        projectTitle
      }
    });
  }

  /**
   * Send notification when client requests changes
   */
  async sendChangesRequestedNotification(
    freelancerId: string,
    projectId: string,
    projectTitle: string,
    changeMessage?: string
  ) {
    return await this.send(freelancerId, 'CHANGES_REQUESTED', {
      title: 'Changes Requested',
      message: `Changes have been requested for "${projectTitle}"`,
      priority: 'URGENT',
      projectId,
      data: {
        projectTitle,
        changeMessage
      }
    });
  }

  /**
   * Send notification when payment is released
   */
  async sendPaymentReleasedNotification(
    freelancerId: string,
    projectId: string,
    projectTitle: string,
    amount: number
  ) {
    return await this.send(freelancerId, 'PAYMENT_RELEASED', {
      title: 'Payment Released',
      message: `Payment of $${amount} for "${projectTitle}" has been released`,
      priority: 'HIGH',
      projectId,
      data: {
        projectTitle,
        amount
      }
    });
  }

  // Service Order Notification Methods

  /**
   * Send service order related notifications
   */
  async sendServiceOrderNotification(
    userId: string,
    orderId: string,
    serviceTitle: string,
    userName: string,
    type: 'SERVICE_ORDER_RECEIVED' | 'SERVICE_ORDER_ACCEPTED' | 'SERVICE_ORDER_DELIVERED' | 'SERVICE_ORDER_APPROVED' | 'SERVICE_ORDER_REVISION_REQUESTED' | 'SERVICE_ORDER_COMPLETED' | 'SERVICE_ORDER_CANCELLED'
  ) {
    const notificationConfig = {
      'SERVICE_ORDER_RECEIVED': {
        title: 'New Service Order',
        message: `${userName} placed an order for "${serviceTitle}"`,
        priority: 'HIGH' as NotificationPriority
      },
      'SERVICE_ORDER_ACCEPTED': {
        title: 'Order Accepted',
        message: `Your order for "${serviceTitle}" has been accepted`,
        priority: 'HIGH' as NotificationPriority
      },
      'SERVICE_ORDER_DELIVERED': {
        title: 'Order Delivered',
        message: `Your order for "${serviceTitle}" has been delivered`,
        priority: 'HIGH' as NotificationPriority
      },
      'SERVICE_ORDER_APPROVED': {
        title: 'Order Approved',
        message: `Your delivery for "${serviceTitle}" has been approved`,
        priority: 'HIGH' as NotificationPriority
      },
      'SERVICE_ORDER_REVISION_REQUESTED': {
        title: 'Revision Requested',
        message: `Revision requested for "${serviceTitle}"`,
        priority: 'URGENT' as NotificationPriority
      },
      'SERVICE_ORDER_COMPLETED': {
        title: 'Order Completed',
        message: `Order for "${serviceTitle}" has been completed`,
        priority: 'NORMAL' as NotificationPriority
      },
      'SERVICE_ORDER_CANCELLED': {
        title: 'Order Cancelled',
        message: `Order for "${serviceTitle}" has been cancelled`,
        priority: 'NORMAL' as NotificationPriority
      }
    };

    const config = notificationConfig[type];

    return await this.send(userId, type, {
      title: config.title,
      message: config.message,
      priority: config.priority,
      data: {
        orderId,
        serviceTitle,
        userName
      }
    });
  }

  /**
   * Send service review notification
   */
  async sendServiceReviewNotification(
    freelancerId: string,
    serviceId: string,
    serviceTitle: string,
    rating: number
  ) {
    return await this.send(freelancerId, 'SERVICE_REVIEW_RECEIVED', {
      title: 'New Service Review',
      message: `You received a ${rating}-star review for "${serviceTitle}"`,
      priority: 'NORMAL',
      data: {
        serviceId,
        serviceTitle,
        rating
      }
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();