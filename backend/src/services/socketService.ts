import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient, MessageType } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const setupSocketIO = (io: SocketIOServer) => {
  console.log('🔌 Socket.IO server initialized');
  
  // Set Socket.IO instance in notification service
  notificationService.setSocketIO(io);
  
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    console.log('🔐 Socket.IO authentication attempt from:', socket.handshake.address);
    try {
      const token = socket.handshake.auth.token;
      console.log('🔑 Token received:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('No token provided'));
      }

      if (!process.env.JWT_SECRET) {
        console.log('❌ JWT secret not configured');
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      console.log('✅ Token decoded, userId:', decoded.userId);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true }
      });

      if (!user) {
        console.log('❌ User not found for id:', decoded.userId);
        return next(new Error('User not found'));
      }

      console.log('✅ User authenticated:', user.email);
      socket.userId = user.id;
      next();
    } catch (error) {
      console.log('❌ Authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join conversation rooms
    socket.on('join_conversations', async () => {
      try {
        const conversations = await prisma.conversationParticipant.findMany({
          where: { userId: socket.userId },
          select: { conversationId: true }
        });

        conversations.forEach(conv => {
          socket.join(`conversation:${conv.conversationId}`);
        });
      } catch (error) {
        console.error('Error joining conversations:', error);
      }
    });

    // Join specific conversation
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!
            }
          }
        });

        if (participant) {
          socket.join(`conversation:${conversationId}`);
          
          // Update last read timestamp
          await prisma.conversationParticipant.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId: socket.userId!
              }
            },
            data: { lastReadAt: new Date() }
          });

          socket.emit('joined_conversation', { conversationId });
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Send message
    socket.on('send_message', async (data: {
      conversationId: string;
      content: string;
      type?: MessageType;
      attachments?: string[];
    }) => {
      try {
        const { conversationId, content, type = MessageType.TEXT, attachments = [] } = data;

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!
            }
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'Not authorized to send message in this conversation' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId!,
            content,
            type,
            attachments
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Emit message to all conversation participants
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId,
        isTyping: false
      });
    });

    // Mark messages as read
    socket.on('mark_messages_read', async (conversationId: string) => {
      try {
        await prisma.conversationParticipant.update({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!
            }
          },
          data: { lastReadAt: new Date() }
        });

        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          userId: socket.userId,
          conversationId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Notification-specific events
    socket.on('get_notifications', async (data: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
      try {
        const notifications = await notificationService.getUserNotifications(
          socket.userId!,
          data
        );
        socket.emit('notifications_list', notifications);
      } catch (error) {
        console.error('Error getting notifications:', error);
        socket.emit('error', { message: 'Failed to get notifications' });
      }
    });

    socket.on('get_unread_count', async () => {
      try {
        const count = await notificationService.getUnreadCount(socket.userId!);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        await notificationService.markAsRead(notificationId, socket.userId!);
        socket.emit('notification_marked_read', { notificationId });
        
        // Send updated unread count
        const count = await notificationService.getUnreadCount(socket.userId!);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        socket.emit('error', { message: 'Failed to mark notification as read' });
      }
    });

    socket.on('mark_all_notifications_read', async () => {
      try {
        const result = await notificationService.markAllAsRead(socket.userId!);
        socket.emit('all_notifications_marked_read', result);
        socket.emit('unread_count', { count: 0 });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        socket.emit('error', { message: 'Failed to mark all notifications as read' });
      }
    });

    socket.on('delete_notification', async (notificationId: string) => {
      try {
        await notificationService.deleteNotification(notificationId, socket.userId!);
        socket.emit('notification_deleted', { notificationId });
        
        // Send updated unread count
        const count = await notificationService.getUnreadCount(socket.userId!);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error deleting notification:', error);
        socket.emit('error', { message: 'Failed to delete notification' });
      }
    });

    // Send unread count when user connects
    socket.on('request_unread_count', async () => {
      try {
        const count = await notificationService.getUnreadCount(socket.userId!);
        socket.emit('unread_count', { count });
      } catch (error) {
        console.error('Error getting initial unread count:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};