import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { validate, messageSchema } from '../utils/validation';
import { messageUpload, getFileUrl } from '../utils/fileUpload';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's conversations
router.get('/conversations', asyncHandler(async (req: AuthRequest, res) => {
  const { filter } = req.query; // 'all', 'unread', 'archived', 'pinned'

  // Build where clause for participants
  const participantWhere: any = {
    userId: req.user!.id
  };

  if (filter === 'archived') {
    // Show only archived conversations
    participantWhere.isArchived = true;
  } else if (filter === 'pinned') {
    // Show only pinned conversations (not archived)
    participantWhere.isPinned = true;
    participantWhere.isArchived = { not: true };
  } else {
    // For 'all' or 'unread' filter, exclude archived conversations
    // Using 'not: true' allows null (newly created) and false (explicitly not archived)
    participantWhere.isArchived = { not: true };
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: participantWhere
      }
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      serviceOrder: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          service: {
            select: {
              id: true,
              title: true
            }
          }
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              lastActiveAt: true
            }
          }
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Calculate unread message counts and add message preview
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const participant = conversation.participants.find(p => p.userId === req.user!.id);
      const lastReadAt = participant?.lastReadAt;

      let unreadCount = 0;
      if (lastReadAt) {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: req.user!.id },
            createdAt: { gt: lastReadAt }
          }
        });
      } else {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: req.user!.id }
          }
        });
      }

      // Get message preview (first 60 characters of last message)
      const lastMessage = conversation.messages[0];
      const messagePreview = lastMessage
        ? lastMessage.content.substring(0, 60) + (lastMessage.content.length > 60 ? '...' : '')
        : null;

      return {
        ...conversation,
        unreadCount,
        messagePreview,
        hasUnread: unreadCount > 0,
        isArchived: participant?.isArchived || false,
        isPinned: participant?.isPinned || false,
        pinnedAt: participant?.pinnedAt || null
      };
    })
  );

  // Sort: Pinned first (by pinnedAt desc), then by updatedAt desc
  const sortedConversations = conversationsWithUnread.sort((a, b) => {
    // Pinned conversations come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Both pinned: sort by pinnedAt (most recently pinned first)
    if (a.isPinned && b.isPinned) {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    }

    // Not pinned: sort by updatedAt
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  res.json({
    success: true,
    conversations: sortedConversations
  });
}));

// Get conversation by ID
router.get('/conversations/:conversationId', asyncHandler(async (req: AuthRequest, res) => {
  const { conversationId } = req.params;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    }
  });

  if (!participant) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          freelancer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    conversation
  });
}));

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', asyncHandler(async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    }
  });

  if (!participant) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      skip,
      take,
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
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.message.count({ where: { conversationId } })
  ]);

  // Update last read timestamp
  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    },
    data: { lastReadAt: new Date() }
  });

  res.json({
    success: true,
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// Create direct conversation (for portfolio contact, general inquiry, etc.)
router.post('/conversations/direct', asyncHandler(async (req: AuthRequest, res) => {
  const { participantId, context } = req.body;

  if (!participantId) {
    throw new AppError('Participant ID is required', 400);
  }

  // Don't allow users to message themselves
  if (req.user!.id === participantId) {
    throw new AppError('Cannot create conversation with yourself', 400);
  }

  // Verify the participant exists
  const participant = await prisma.user.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true
    }
  });

  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  // Check if conversation already exists between these users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      projectId: { equals: null }, // Explicitly specify null check for direct conversations
      participants: {
        every: {
          userId: {
            in: [req.user!.id, participantId]
          }
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  // Check if existing conversation has exactly these two participants
  if (existingConversation && existingConversation.participants.length === 2) {
    const participantIds = existingConversation.participants.map(p => p.userId).sort();
    const requestedIds = [req.user!.id, participantId].sort();
    
    if (participantIds[0] === requestedIds[0] && participantIds[1] === requestedIds[1]) {
      return res.json({
        success: true,
        conversation: existingConversation,
        message: 'Direct conversation already exists'
      });
    }
  }

  // Create direct conversation with participants
  const conversation = await prisma.conversation.create({
    data: {
      // projectId: null is implicit since field is optional
      participants: {
        create: [
          { userId: req.user!.id },
          { userId: participantId }
        ]
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Direct conversation created successfully',
    conversation,
    context // Pass back any context info (portfolio, etc.)
  });
}));

// Create conversation for a project
router.post('/conversations', asyncHandler(async (req: AuthRequest, res) => {
  const { projectId, participantId } = req.body;

  if (!projectId) {
    throw new AppError('Project ID is required', 400);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      freelancerId: true,
      status: true
    }
  });

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  let otherParticipantId: string;

  // Scenario 1: Project has an assigned freelancer (standard project conversation)
  if (project.freelancerId && !participantId) {
    // Only client or assigned freelancer can create conversation
    if (req.user!.id !== project.clientId && req.user!.id !== project.freelancerId) {
      throw new AppError('Not authorized to create conversation for this project', 403);
    }
    otherParticipantId = req.user!.id === project.clientId ? project.freelancerId : project.clientId;
  }
  // Scenario 2: Bid conversation between client and applicant freelancer
  else if (participantId) {
    // Must be client or the specified participant
    if (req.user!.id !== project.clientId && req.user!.id !== participantId) {
      throw new AppError('Not authorized to create conversation between these participants', 403);
    }
    
    // Verify the participant has applied to the project (if not the client)
    if (req.user!.id === project.clientId) {
      const application = await prisma.application.findUnique({
        where: {
          projectId_freelancerId: {
            projectId,
            freelancerId: participantId
          }
        }
      });
      
      if (!application) {
        throw new AppError('Participant must have applied to this project', 400);
      }
    }
    
    otherParticipantId = req.user!.id === project.clientId ? participantId : project.clientId;
  } else {
    throw new AppError('Project must have an assigned freelancer or specify a participant for bid conversation', 400);
  }

  // Check if conversation already exists between these participants
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      projectId,
      participants: {
        every: {
          userId: {
            in: [req.user!.id, otherParticipantId]
          }
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  // For bid conversations, we need to check if a conversation exists between these specific participants
  if (existingConversation && existingConversation.participants.length === 2) {
    const participantIds = existingConversation.participants.map(p => p.userId).sort();
    const requestedIds = [req.user!.id, otherParticipantId].sort();
    
    if (participantIds[0] === requestedIds[0] && participantIds[1] === requestedIds[1]) {
      return res.json({
        success: true,
        conversation: existingConversation,
        message: 'Conversation already exists'
      });
    }
  }

  // Create conversation with participants
  const conversation = await prisma.conversation.create({
    data: {
      projectId,
      participants: {
        create: [
          { userId: req.user!.id },
          { userId: otherParticipantId }
        ]
      }
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Conversation created successfully',
    conversation
  });
}));

// Send message (HTTP endpoint as backup to Socket.IO)
router.post('/conversations/:conversationId/messages', validate(messageSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { content, type = 'TEXT', attachments = [] } = req.body;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    }
  });

  if (!participant) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user!.id,
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

  // Unarchive conversation for all participants when a new message is sent
  // This ensures archived conversations become active again when someone sends a message
  await prisma.conversationParticipant.updateMany({
    where: {
      conversationId,
      isArchived: true
    },
    data: {
      isArchived: false,
      archivedAt: null
    }
  });

  res.status(201).json({
    success: true,
    message
  });
}));

// Upload files for messages with error handling
router.post('/upload', (req: AuthRequest, res, next) => {
  messageUpload.array('files', 5)(req, res, (err: any) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }
    next();
  });
}, asyncHandler(async (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[];

  console.log('Upload request received, files:', files?.length || 0);

  if (!files || files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  // Generate file URLs
  const fileUrls = files.map(file => ({
    url: getFileUrl(file.filename),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  }));

  console.log('Files uploaded successfully:', fileUrls.length);

  res.json({
    success: true,
    files: fileUrls
  });
}));

// Archive/unarchive conversation
router.patch('/conversations/:conversationId/archive', asyncHandler(async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { isArchived } = req.body;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    }
  });

  if (!participant) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  const updatedParticipant = await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    },
    data: {
      isArchived: typeof isArchived === 'boolean' ? isArchived : true,
      archivedAt: typeof isArchived === 'boolean' && isArchived ? new Date() : null
    }
  });

  res.json({
    success: true,
    message: isArchived ? 'Conversation archived' : 'Conversation unarchived',
    isArchived: updatedParticipant.isArchived
  });
}));

// Pin/unpin conversation
router.patch('/conversations/:conversationId/pin', asyncHandler(async (req: AuthRequest, res) => {
  const { conversationId } = req.params;
  const { isPinned } = req.body;

  // Verify user is participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    }
  });

  if (!participant) {
    throw new AppError('Conversation not found or access denied', 404);
  }

  // Limit pinned conversations to 10
  if (isPinned) {
    const pinnedCount = await prisma.conversationParticipant.count({
      where: {
        userId: req.user!.id,
        isPinned: true
      }
    });

    if (pinnedCount >= 10) {
      throw new AppError('You can only pin up to 10 conversations', 400);
    }
  }

  const updatedParticipant = await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: req.user!.id
      }
    },
    data: {
      isPinned: typeof isPinned === 'boolean' ? isPinned : true,
      pinnedAt: typeof isPinned === 'boolean' && isPinned ? new Date() : null
    }
  });

  res.json({
    success: true,
    message: isPinned ? 'Conversation pinned' : 'Conversation unpinned',
    isPinned: updatedParticipant.isPinned
  });
}));

export default router;